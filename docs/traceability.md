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
| FR-04 | UC02 | `ScenarioConstraint`, `OrToolsSolver` | TEST | `BruteForceSolverTest`, `SolverParityTest`, `OrToolsSolverRegressionTest`, `SolverEdgeCaseTest` |
| FR-05 | UC02 | `ScenarioBuilder`, `sessionStorage` | MANUALE | Collaudo passi 8–14 |
| FR-06 | UC02 | `BudgetConstraint`, `ScenarioBuilder` | TEST | `BruteForceSolverTest.matchesPitchExampleBudget10k` |
| FR-07 | UC02 | `Objective`, `ScenarioBuilder` | TEST | `BruteForceSolverTest.objectiveChangeChangesResult` |
| FR-08 | UC03 | `OptimizationService`, `OrToolsSolver` | TEST | `OrToolsSolverTest` + `SolverParityTest` |
| FR-09 | UC04 | `ResultPage` | MANUALE | Collaudo passo 11 |
| FR-10 | UC04 | `OptimizationResult` | TEST | `OrToolsSolverTest.picksBestCombinationWhenBudgetIsLimited` |
| FR-11 | UC04 | `ExplanationService` | TEST | `ExplanationServiceTest` |
| FR-12 | UC05 | `scenarioStore`, `ResultPage` | MANUALE | Collaudo passi 12–13 |
| FR-13 | UC05 | `ComparePage` | TEST + MANUALE | `ComparePage.test.tsx` + collaudo passo 14 |
| FR-14 | UC01, UC04 | `DataProvenance`, badge "DEMO" | MANUALE | Visibile in ogni pagina |
| FR-15 | UC01 | `ImportController` (commons-csv) | PARZIALE | Implementato; test automatico assente; collaudo manuale precedente |
| FR-16 | UC03 | `OptimizationRun`, `ProblemHasher`, `explanationsJson` | TEST + PARZIALE | Serializzazione Jackson; hash canonico testato; round-trip JSON non testato |
| FR-17 | UC03 | `SolverStatus`, `StepStatus` | TEST | `OrToolsSolverRegressionTest.infeasibleDueTo...` |
| FR-18 | — | `AiAssistant`, `AiController`, `LlmAiAssistant`, `AiAssistantPanel` | TEST | `LlmAiAssistantTest` (10) + `AiAssistantPanel.test.tsx` (8); default `RuleBasedAiAssistant`; LLM opzionale |

## Requisiti non funzionali

| NFR | Verifica | Evidenza |
|---|---|---|
| NFR-01 Usabilità | Utente non tecnico crea e confronta due scenari | MANUALE (collaudo) |
| NFR-02 Isolamento | Test solver senza Spring/DB | TEST (`OrToolsSolverTest`, `SolverEdgeCaseTest`) |
| NFR-03 Riproducibilità | Run identici → selezione identica | TEST (`OrToolsSolverRegressionTest.tieBreakDeterministicAcrossRuns`) + MANUALE (3 run) |
| NFR-04 Interpretabilità | Ogni spiegazione cita vincoli reali | TEST (`ExplanationServiceTest`) |
| NFR-05 Sostituibilità | Adapter solver intercambiabili | TEST (`SolverParityTest`, `SolverEdgeCaseTest.bothSolversProduceSameHashForSameProblem`) |
| NFR-06 Tracciabilità | FR → UC → componente → test | Questa matrice |
| NFR-07 Trasparenza | Natura sintetica visibile in UI | MANUALE (badge DEMO) |
| NFR-08 Prestazioni | Run 26 opzioni < 5s | MANUALE (log backend) |
| NFR-09 Integrità | Snapshot coerente; risultati immutabili | PARZIALE: `optimization_runs` immutabile, ma nessuna `data_revision` esplicita |
| NFR-10 Protezione | Nessun segreto nel repo | Verificato: `LLM_API_KEY=` vuota in `.env.example`; `.env` in `.gitignore`; grep su diff non rileva chiavi |

## Copertura per famiglia di test

### Backend (61)

| Classe | Test | Copertura |
|---|---|---|
| `BruteForceSolverTest` | 12 | Oracle esaustivo: vincoli, tie-break, casi limite |
| `OrToolsSolverTest` | 6 | CP-SAT: budget, incompatibilità, prerequisiti, maxNumber, infeasible |
| `OrToolsSolverRegressionTest` | 10 | Multi-pass, tie-break canonico, stati |
| `SolverParityTest` | 4 | Parità OrTools vs BruteForce |
| `SolverEdgeCaseTest` | 8 | Prerequisiti vs non-candidati, hash canonico, IncludeConstraint |
| `ExplanationServiceTest` | 4 | Reason code per ogni famiglia |
| `DemoDatasetCoherenceTest` | 5 | Coerenza dataset (H2) |
| `LlmAiAssistantTest` | 10 | Provider LLM, fallback, validazione |
| `ScenarioControllerTest` | 2 | `@WebMvcTest` endpoint scenarios |

### Frontend (15)

| Classe | Test | Copertura |
|---|---|---|
| `Dashboard.test.tsx` | 2 | Stato vuoto, principio architetturale |
| `ComparePage.test.tsx` | 2 | Stato vuoto, tabella A vs B |
| `scenarioStore.test.ts` | 3 | Store su sessionStorage |
| `AiAssistantPanel.test.tsx` | 8 | Status AI, proposta, apply, reject, errore, fallback |

## Riepilogo

- **TEST**: 15 FR/NFR con copertura automatica.
- **MANUALE**: 8 FR/NFR verificati nel collaudo.
- **PARZIALE**: FR-15 (import CSV), FR-16 (round-trip JSON), NFR-09 (snapshot versionato).

## Aggiornamenti Fase C

- FR-04, FR-16, FR-17: copertura estesa dai nuovi test `SolverEdgeCaseTest`.
- FR-18: nuova copertura automatica backend e frontend.
- NFR-05: copertura estesa al caso hash canonico coerente tra solver.

Vedi `docs/collaudo.md` per i dettagli del collaudo manuale.