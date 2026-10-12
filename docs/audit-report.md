# TEPO — Audit Report

## Stato del progetto

MVP completo, testato, con:
- hardening del solver (Fase C);
- integrazione AI opzionale (Fase C);
- validazione matematica indipendente (Fase E);
- dataset demo con obiettivi distinti (Fase E);
- analisi di sensibilità sul budget (Fase E).

Test automatici: **101 backend**, **19 frontend**, tutti verdi.

## Controlli eseguiti

| Controllo | Esito | Data |
|---|---|---|
| `mvn -B clean test` | 101/101 verdi | 2026-10-12 |
| `npm test -- --run` | 19/19 verdi | 2026-10-12 |
| `npx tsc --noEmit` | pulito | 2026-10-12 |
| `npm run build` | OK | 2026-10-12 |
| `docker compose build --no-cache` | OK | 2026-10-11 |

Ambiente: JDK 21 Temurin, Maven 3.9, Docker Desktop, PostgreSQL 16, OR-Tools 9.11.

## Cronologia degli interventi

### Fase 2 (precedente)

- P1 — Tie-break lessicografico (ricostruzione integrale del modello).
- P3 — Distinzione `OPTIMAL` / `FEASIBLE` / `INFEASIBLE` / `UNKNOWN`.
- P8 — Timeout multi-pass (poi esteso in Fase C).
- P2 — Unità e dataset (ipotesi sintetiche esplicite).

### Fase C (hardening solver + AI)

- **B1** — prerequisiti verso opzioni non-candidate: forzatura `x_opt = 0` in `OrToolsSolver`.
- **B2** — `IncludeConstraint` su opzione non-candidata: pre-validazione ⇒ `INFEASIBLE`.
- **B3** — `SolverConfiguration` ignorata: 3 timeout per fase via `@Value`.
- **B4** — `problemHash` non canonico: sostituito con `ProblemHasher` SHA-256.
- **B5** — doppio budget incoerente: rifiuto esplicito in `OptimizationService`.
- **AI** — `LlmAiAssistant` riscritto con client HTTP reale, prompt strutturato, fallback deterministico, validazione server-side, UI `AiAssistantPanel`.

### Fase E (validazione matematica)

- **Equivalenza obiettivi** — scoperto che il dataset applicava due fattori
  costanti (`× 20` per economia, `× 0.25` per CO₂), rendendo `ENERGY_SAVING`,
  `ECONOMIC_SAVING` e `CO2_REDUCTION` matematicamente equivalenti. Corretto
  introducendo due vettori energetici scorrelati:
  - elettricità (LED, FV): 0.25 EUR/kWh, 0.10 kg CO₂/kWh;
  - gas metano (involucro, impianti): 0.10 EUR/kWh, 0.20 kg CO₂/kWh.
  Verificato da `DemoDatasetCoherenceTest`, `MultiObjectiveDiscriminativeTest`,
  `DemoMultiObjectiveEmpiricalTest`.
- **Parità randomizzata** — aggiunto `SolverRandomizedParityTest`: 50 seed × 3 obiettivi
  = 150 confronti OrTools↔BruteForce, più 150 verifiche di auto-consistenza
  indipendenti dal solver.
- **Reason code** — corretto `SELEZIONATO_PREREQUISITO` (non etichettare
  come prerequisito se il richiedente non è selezionato); aggiunti
  `ESCLUSO_ESPLICITO` e `ESCLUSO_MAX_NUMBER`.
- **Import CSV** — validazione stringente su `surfaceM2`, `municipality`,
  `buildingType`; rimozione del default silenzioso a zero; `skippedDetails`
  in risposta.
- **Sensitivity** — nuovo `SensitivityService` + `SensitivityController` +
  `SensitivityPage`. Sweep deterministico sul budget, non persistente,
  senza chiamate LLM.

## Bug trovati e risolti in questa sessione

| ID | Descrizione | Fix | Test |
|---|---|---|---|
| E-01 | Dataset con obiettivi equivalenti | due vettori energetici scorrelati | `DemoDatasetCoherenceTest`, `MultiObjectiveDiscriminativeTest`, `DemoMultiObjectiveEmpiricalTest` |
| E-02 | `SELEZIONATO_PREREQUISITO` mal calcolato | verifica che il richiedente sia selezionato | `ExplanationReasonCodeTest` |
| E-03 | `MaxNumberConstraint` non diagnosticato | nuovo reason code `ESCLUSO_MAX_NUMBER` | `ExplanationReasonCodeTest` |
| E-04 | `ExcludeConstraint` non diagnosticato | nuovo reason code `ESCLUSO_ESPLICITO` | `ExplanationReasonCodeTest` |
| E-05 | Import CSV: valori malformati a zero | validazione stringente + `requireDouble` | `ImportControllerTest` |
| E-06 | `@Value` senza initializer (test fuori Spring) | initializer `= 10`, `= 3`, `= 1` | `SensitivityServiceTest` |

## Criticità aperte

- **P4** — round-trip JSON di `explanations_json` non testato.
- **P9** — `scenarioId` fisso a `SCN-DEMO` (A/B in `sessionStorage`).
- **NFR-09** — snapshot immutabile non versionato (`dataRevision`).
- **Multi-ottimi** — nessun rilevatore di portafogli alternativi ottimi equivalenti.
- **`coefficientScale`** — campo morto in `OptimizationProblem`.
- **8 vulnerabilità transitive `npm audit`** — non risolvibili senza rompere
  Vite/React; documentate.
- **Docker `node:25-alpine` vs `ISTRUZIONI-AVVIO.md`** — discrepanza minore.
- **Colori marker Leaflet hardcoded** — non seguono il tema scuro.
- **FOUC dark mode** al primo caricamento.

## Controlli non eseguiti

| Controllo | Motivo |
|---|---|
| `docker compose up -d` end-to-end con health check completo | Verificato `build`, non `up` |
| Test con provider LLM reale | Richiede credenziali |
| Import CSV su file esterni reali | Solo dati di test |
| Verifica tempi su 26 opzioni con timeout reali | Non eseguita in Fase E |

## Note

- Il progetto è un MVP accademico.
- Il dataset demo è sintetico.
- L'integrazione AI è opzionale e non attivata di default.
- L'analisi di sensibilità è deterministica, non Monte Carlo.
