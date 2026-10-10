# TEPO — Audit Report

## Stato del progetto

MVP completo e funzionante end-to-end. Fase 2 dell'audit conclusa:
correzioni critiche applicate al solver e al dataset demo. Test automatici verdi.

## Controlli eseguiti

| Controllo | Esito effettivo |
|---|---|
| `mvn clean test` | 43 test, 43 passati, 0 falliti |
| `BruteForceSolverTest` | 12/12 |
| `ExplanationServiceTest` | 4/4 |
| `OrToolsSolverRegressionTest` | 10/10 |
| `OrToolsSolverTest` | 6/6 |
| `SolverParityTest` | 4/4 |
| `DemoDatasetCoherenceTest` | 5/5 (H2 in-memory) |
| `/api/buildings` | 10 edifici |
| `/api/interventions` | 26 interventi, payback 8-25 anni |

Comandi eseguiti in ambiente con JDK 21 Temurin, Maven 3.9, Docker Desktop,
PostgreSQL 16, OR-Tools 9.11.

## Criticità risolte (Fase 2)

### P1 — Tie-break lessicografico (RISOLTO)

**File:** `optimization/OrToolsSolver.java`.

**Prima:** `runLexicographicIds` aggiungeva vincoli progressivamente sullo
stesso `CpModel`, corrompendolo quando il solver ritornava `UNSAT`.

**Dopo:** ad ogni iterazione il metodo ricostruisce integralmente il modello
e applica le forzature accumulate. Se una qualunque iterazione ritorna
`UNKNOWN`, il metodo ritorna `null` e il risultato finale è marcato
`canonicalTieBreakCompleted=false`.

**Test di copertura:** `OrToolsSolverRegressionTest.tieBreakPrefersLowerId...`,
`tieBreakOnMultipleOptimaWithSameCostDifferentCount`,
`tieBreakDeterministicAcrossRuns`.

### P3 — Distinzione stati (RISOLTO)

**File:** `optimization/OrToolsSolver.java`.

**Prima:** `runPrimary` ritornava `null` sia per `INFEASIBLE` sia per
`UNKNOWN`, e il chiamante interpretava `null` come `INFEASIBLE`.

**Dopo:** introduzione di `StepStatus` con quattro valori
(`OPTIMAL`, `FEASIBLE`, `INFEASIBLE`, `UNKNOWN`). Il chiamante distingue
i casi e popola `SolverStatus` coerentemente.

**Test di copertura:** `infeasibleDueToContradictoryConstraints`,
`infeasibleDueToPrerequisiteCostExceedsBudget`.

### P8 — Timeout multi-pass (RISOLTO)

**File:** `optimization/OrToolsSolver.java`.

**Prima:** ogni passo usava lo stesso `maxTimeSeconds`, producendo un
budget complessivo non limitato (N × 10s).

**Dopo:** timeout dedicati per fase:
- `PRIMARY_TIMEOUT_SECONDS = 10` (budget pieno);
- `SECONDARY_TIMEOUT_SECONDS = 3` (costo, count);
- `LEXICOGRAPHIC_TIMEOUT_SECONDS = 1` (per ogni iterazione).

Documentato in `docs/optimization.md`.

### P2 — Unità e dataset (RISOLTO)

**File:** `configuration/DemoDataLoader.java`.

**Prima:** valori ambigui, payback irrealistici (fino a 50+ anni).

**Dopo:** ipotesi sintetiche esplicite:
- tariffa 0.20 EUR/kWh (20 cent/kWh);
- fattore CO₂ 0.25 kg/kWh;
- scala 1:1 per energia e CO₂;
- payback demo 8–25 anni.

**Test di copertura:** `DemoDatasetCoherenceTest` verifica coerenza
economica, CO₂, payback e provenienza SYNTHETIC.

## Criticità aperte (Fase 3)

### P4 — `explanationsJson` non serializzato

**File:** `application/OptimizationService.java`.
**Impatto:** le spiegazioni non sono persistite nell'audit trail.
**Prossimo passo:** serializzare `List<Explanation>` con Jackson,
aggiungere test di round-trip.

### P5 — Parser CSV fragile

**File:** `api/ImportController.java`.
**Impatto:** celle con virgole in virgolette, BOM UTF-8, decimali
italiani rompono il parsing.
**Prossimo passo:** adottare `commons-csv`, gestire BOM e locale.

### P6 — Spiegazioni locali vs globali

**File:** `optimization/ExplanationService.java`.
**Impatto:** `ESCLUSO_NON_OTTIMALE` copre sia barriere locali sia cause
globali non determinate.
**Prossimo passo:** chiarire i reason code, aggiornare documentazione,
distinguere i casi.

### P7 — Matrice di tracciabilità

**File:** `docs/traceability.md`.
**Impatto:** alcune righe dichiarano copertura con "(E2E)" senza test reale.
**Prossimo passo:** aggiungere colonna "Evidenza" con valori
`TEST`/`MANUALE`/`DA FARE`.

### P9 — `scenarioId` fisso

**File:** `frontend/src/pages/ScenarioBuilder.tsx`.
**Impatto:** tutti i run confluiscono sotto `SCN-DEMO`.
**Prossimo passo:** introdurre concetto di scenario persistente lato
backend (out of scope MVP, documentare come limite).

### P10 — Documentazione AI

**File:** `docs/requirements.md`, `README.md`.
**Impatto:** menzione "LLM orchestratore" senza precisare che il default
è `RuleBasedAiAssistant`.
**Prossimo passo:** riformulare come "interfaccia AI opzionale;
default rule-based; LLM non attivo nell'MVP".

## Controlli non eseguiti

| Controllo | Motivo | Comando |
|---|---|---|
| Docker build completo | Non eseguito in questa fase | `docker compose build` |
| `docker compose up` end-to-end | Non eseguito in questa fase | `docker compose up -d` |
| Frontend build | Non eseguito in questa fase | `cd frontend && npm run build` |
| Determinismo runtime su 26 opzioni | Richiede esecuzione manuale ripetuta | 3 POST identici, confronto |

## Verifiche di Fase 3 raccomandate

1. `mvn clean test` rieseguito dopo ogni modifica.
2. Test manuale frontend con nuovo dataset.
3. Build Docker completo.
4. Confronto A vs B con budget 500k vs 1M.

## Note

- Il progetto è un MVP accademico, non un prodotto in produzione.
- Il dataset demo è sintetico e chiaramente marcato.
- Nessun dato reale del Comune di Trento è incluso.