# TEPO — Audit Report

## Stato del progetto

MVP completo, testato, con:
- hardening del solver (Fase C);
- integrazione AI opzionale (Fase C);
- validazione matematica indipendente (Fase E);
- dataset demo con obiettivi distinti (Fase E);
- analisi di sensibilità sul budget (Fase E).

Test automatici: **119 backend**, **19 frontend**, tutti verdi.

## Controlli eseguiti

| Controllo | Esito | Data |
|---|---|---|
| `mvn -B clean test` (Docker, `maven:3.9-eclipse-temurin-21`) | 119/119 verdi | 2026-10-17 |
| `npm test -- --run` | 19/19 verdi | 2026-10-17 |
| `npx tsc --noEmit` | pulito | 2026-10-17 |
| `npm run build` | OK | 2026-10-17 |
| `docker compose up --build -d` | 3 container healthy | 2026-10-17 |
| `docker compose build --no-cache` | OK | 2026-10-11 |

Ambiente backend di verifica: container `maven:3.9-eclipse-temurin-21` (Linux ARM64 su Docker Desktop WSL2). Stesso container della CI (`ubuntu-latest`, x86_64).

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

### Consolidamento post-audit esterno

- **Parser rule-based riscritto** — `RuleBasedAiAssistant` non gestiva
  correttamente input realistici ("budget 80k", "1,5 milioni", "nel 2027 ho
  400k"). Nuova strategia: pattern unificato numero+unità, scarta anni,
  punteggio di contesto, default esplicito in `missingInformation`.
  `RuleBasedAiAssistantTest` (15 test).
- **Docker Compose healthcheck** — backend e frontend hanno ora `healthcheck`
  e `depends_on: condition: service_healthy`. Rimossa chiave `version:`
  obsoleta. Stack riavviato e verificato su Windows ARM64: 3 container healthy.
- **Test backend portabili via Docker** — `scripts/test-backend.ps1` e
  `scripts/test-backend.sh` eseguono `mvn -B clean test` nel container
  `maven:3.9-eclipse-temurin-21`, lo stesso della CI. Funziona su ogni OS.

## Bug trovati e risolti

| ID | Descrizione | Fix | Test |
|---|---|---|---|
| E-01 | Dataset con obiettivi equivalenti | due vettori energetici scorrelati | `DemoDatasetCoherenceTest`, `MultiObjectiveDiscriminativeTest`, `DemoMultiObjectiveEmpiricalTest` |
| E-02 | `SELEZIONATO_PREREQUISITO` mal calcolato | verifica che il richiedente sia selezionato | `ExplanationReasonCodeTest` |
| E-03 | `MaxNumberConstraint` non diagnosticato | nuovo reason code `ESCLUSO_MAX_NUMBER` | `ExplanationReasonCodeTest` |
| E-04 | `ExcludeConstraint` non diagnosticato | nuovo reason code `ESCLUSO_ESPLICITO` | `ExplanationReasonCodeTest` |
| E-05 | Import CSV: valori malformati a zero | validazione stringente + `requireDouble` | `ImportControllerTest` |
| E-06 | `@Value` senza initializer (test fuori Spring) | initializer `= 10`, `= 3`, `= 1` | `SensitivityServiceTest` |
| E-07 | Parser rule-based sbaglia 80k, anni, decimali | pattern unificato + soglia di contesto | `RuleBasedAiAssistantTest` |

## Criticità aperte

- **P4** — round-trip JSON di `explanations_json` non testato.
- **P9** — `scenarioId` fisso a `SCN-DEMO` (A/B in `sessionStorage`).
- **NFR-09** — snapshot immutabile non versionato (`dataRevision`).
- **Multi-ottimi** — nessun rilevatore di portafogli alternativi ottimi equivalenti.
- **`coefficientScale`** — campo morto in `OptimizationProblem`.
- **8 vulnerabilità transitive `npm audit`** — non risolvibili senza rompere
  Vite/React; documentate.
- **Spring Boot 3.3.4 EOL** — OSS support scaduto il 2025-06-30.
  Migrazione a 4.1 richiede Spring 6→7 + Hibernate 6.5→7 + Jakarta EE 10→11
  (2-4 ore stimate). Dichiarato come debito P1.
- **Node 20 (CI) e Node 25 (Dockerfile)** — entrambi EOL.
  Target corretto: Node 24 LTS. Fix pianificato.
- **Fattore CO₂ elettricità non calibrato** — `DemoDataLoader` usa
  0.10 kg CO₂/kWh (ipotesi "grid Trentino idro-dominante" non documentata).
  Riferimento nazionale ISPRA 2024: ~0.233 kg CO₂/kWh. Da documentare in UI
  o ricalibrare.
- **React 18 frozen** — non è EOL formale, ma l'ultimo rilascio è aprile 2024.
  Rischio pratico basso (client-side, statico). P2.
- **Colori marker Leaflet hardcoded** — non seguono il tema scuro.
- **FOUC dark mode** al primo caricamento.

## Controlli non eseguiti

| Controllo | Motivo |
|---|---|
| Test con provider LLM reale | Richiede credenziali |
| Import CSV su file esterni reali | Solo dati di test |
| Verifica tempi su 26 opzioni con timeout reali | Non eseguita in Fase E |
| Migrazione a Spring Boot 4.1 | Rinviata: rischio regressione in sessione con delivery imminente |

## Nota ambiente locale (Windows on ARM64)

L'host di sviluppo primario è Windows 11 ARM64 (Snapdragon/Qualcomm).
OR-Tools CP-SAT 9.11 **non distribuisce binari nativi per `win32-aarch64`**:
i test che istanziano `OrToolsSolver` non possono girare su JVM nativa
Windows. Errore tipico: `NullPointerException: Resource ortools-win32-aarch64/
was not found`.

**Effetto**: `mvn test` nativo su Windows ARM64 fallisce con 44 errori
(tutti i test che toccano il solver), più 1 failure derivato
(`SensitivityServiceTest`). Non è un bug del progetto, è un limite di
OR-Tools.

**Soluzione adottata**: i test backend e l'avvio completo si eseguono via
Docker, dove OR-Tools Linux ARM64 funziona nativamente:

```powershell
# Avvio completo (qualsiasi OS con Docker)
docker compose up --build

# Test backend
.\scripts\test-backend.ps1
```

Il container `maven:3.9-eclipse-temurin-21` è **lo stesso della CI**,
quindi l'ambiente è riproducibile su ogni OS.

**Baseline confermata** (Docker, 2026-10-17): **119/119 verdi**.

Il frontend (`npm test`, `npm run build`) funziona nativamente su Node 24,
senza limiti di architettura.

## Note

- Il progetto è un MVP accademico.
- Il dataset demo è sintetico.
- L'integrazione AI è opzionale e non attivata di default.
- L'analisi di sensibilità è deterministica, non Monte Carlo.
- L'avvio primario è Docker Compose: nessuna dipendenza da JDK, Maven o Node installati localmente.
