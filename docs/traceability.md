# Matrice di tracciabilità

Legenda evidenza:
- `TEST` — esiste un test automatico che copre il requisito.
- `MANUALE` — verificato manualmente durante il collaudo (vedi `docs/collaudo.md`).
- `PARZIALE` — coperto in parte, con limiti documentati.
- `DA FARE` — non ancora verificato.

## Requisiti funzionali

| FR | UC | Componente | Evidenza | Note |
|---|---|---|---|---|
| FR-01 | UC01 | `BuildingController`, `BuildingRepository` | MANUALE | Collaudo passi 5–6 |
| FR-02 | UC01 | `InterventionType`, `InterventionTypeRepository` | MANUALE | Catalogo mostrato in `/intervention-types` |
| FR-03 | UC01 | `InterventionOption`, `InterventionOptionRepository` | MANUALE | Collaudo passo 7 |
| FR-04 | UC02 | `ScenarioConstraint`, `OrToolsSolver` | TEST | `BruteForceSolverTest`, `SolverParityTest`, `OrToolsSolverRegressionTest` |
| FR-05 | UC02 | `ScenarioBuilder`, `sessionStorage` | MANUALE | Collaudo passi 8–14 |
| FR-06 | UC02 | `BudgetConstraint`, `ScenarioBuilder` | TEST | `BruteForceSolverTest.matchesPitchExampleBudget10k` |
| FR-07 | UC02 | `Objective`, `ScenarioBuilder` | TEST | `BruteForceSolverTest.objectiveChangeChangesResult` |
| FR-08 | UC03 | `OptimizationService`, `OrToolsSolver` | TEST | `OrToolsSolverTest` + `SolverParityTest` |
| FR-09 | UC04 | `ResultPage` | MANUALE | Collaudo passo 11 |
| FR-10 | UC04 | `OptimizationResult` | TEST | `OrToolsSolverTest.picksBestCombinationWhenBudgetIsLimited` |
| FR-11 | UC04 | `ExplanationService` | TEST | `ExplanationServiceTest` |
| FR-12 | UC05 | `scenarioStore`, `ResultPage` | MANUALE | Collaudo passi 12–13 |
| FR-13 | UC05 | `ComparePage` | MANUALE | Collaudo passo 14 |
| FR-14 | UC01, UC04 | `DataProvenance`, badge "DEMO" | MANUALE | Visibile in ogni pagina |
| FR-15 | UC01 | `ImportController` (commons-csv) | DA FARE | Implementato, test manuale da eseguire |
| FR-16 | UC03 | `OptimizationRun`, `explanationsJson` | TEST | Serializzazione Jackson attiva |
| FR-17 | UC03 | `SolverStatus`, `StepStatus` | TEST | `OrToolsSolverRegressionTest.infeasibleDueTo...` |
| FR-18 | — | `AiAssistant`, `AiController` | MANUALE | Default `RuleBasedAiAssistant`; LLM non attivo |

## Requisiti non funzionali

| NFR | Verifica | Evidenza |
|---|---|---|
| NFR-01 Usabilità | Utente non tecnico crea e confronta due scenari | MANUALE (collaudo) |
| NFR-02 Isolamento | Test solver senza Spring/DB | TEST (`OrToolsSolverTest`) |
| NFR-03 Riproducibilità | Run identici → selezione identica | TEST (`OrToolsSolverRegressionTest.tieBreakDeterministicAcrossRuns`) + MANUALE (3 run) |
| NFR-04 Interpretabilità | Ogni spiegazione cita vincoli reali | TEST (`ExplanationServiceTest`) |
| NFR-05 Sostituibilità | Adapter solver intercambiabili | TEST (`SolverParityTest`) |
| NFR-06 Tracciabilità | FR → UC → componente → test | Questa matrice |
| NFR-07 Trasparenza | Natura sintetica visibile in UI | MANUALE (badge DEMO) |
| NFR-08 Prestazioni | Run 26 opzioni < 5s | MANUALE (log backend) |
| NFR-09 Integrità | Snapshot coerente; risultati immutabili | PARZIALE (audit `optimization_runs`) |
| NFR-10 Protezione | Nessun segreto nel repo | Ispezione `.gitignore` e `.env.example` |

## Riepilogo

- **TEST**: 11 FR/NFR con copertura automatica.
- **MANUALE**: 10 FR/NFR verificati nel collaudo del 2026-10-09.
- **PARZIALE / DA FARE**: FR-15 (test import da eseguire), NFR-09 (audit completo senza snapshot versionato).

Vedi `docs/collaudo.md` per i dettagli del collaudo manuale.