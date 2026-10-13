# Matrice di tracciabilità

Legenda evidenza:
- `TEST` — coperto da test automatico.
- `MANUALE` — verificato manualmente durante il collaudo.
- `PARZIALE` — coperto in parte, con limiti documentati.
- `DA FARE` — non ancora verificato.

## Requisiti funzionali

| FR | Componente | Evidenza | Note |
|---|---|---|---|
| FR-01 Gestire edifici | `BuildingController`, `BuildingRepository` | MANUALE | Collaudo |
| FR-02 Gestire tipologie | `InterventionType`, `InterventionTypeRepository` | MANUALE | Catalogo |
| FR-03 Gestire opzioni | `InterventionOption`, `InterventionOptionRepository` | MANUALE | Collaudo |
| FR-04 Gestire vincoli | `ScenarioConstraint`, `OrToolsSolver` | TEST | `BruteForceSolverTest`, `SolverParityTest`, `OrToolsSolverRegressionTest`, `SolverEdgeCaseTest`, `SolverRandomizedParityTest` |
| FR-05 Creare scenari | `ScenarioBuilder`, `sessionStorage` | MANUALE | Collaudo |
| FR-06 Definire budget | `BudgetConstraint`, `ScenarioBuilder` | TEST | `BruteForceSolverTest` |
| FR-07 Scegliere obiettivo | `Objective`, `ScenarioBuilder` | TEST | `MultiObjectiveDiscriminativeTest`, `DemoMultiObjectiveEmpiricalTest` |
| FR-08 Ottimizzare | `OptimizationService`, `OrToolsSolver` | TEST | Suite solver, `GreedyBaselineComparisonTest` |
| FR-09 Mostrare piano | `ResultPage` | MANUALE | Collaudo |
| FR-10 Mostrare metriche | `OptimizationResult` | TEST | Suite solver |
| FR-11 Spiegare | `ExplanationService` | TEST | `ExplanationServiceTest`, `ExplanationReasonCodeTest` |
| FR-12 What-If | `scenarioStore`, `ResultPage` | MANUALE | Collaudo |
| FR-13 Confrontare | `ComparePage` | TEST + MANUALE | `ComparePage.test.tsx` + collaudo |
| FR-14 Distinguere dati | `DataProvenance`, badge "DEMO" | TEST + MANUALE | `DemoDatasetCoherenceTest.provenanceIsSyntheticForAllOptions` |
| FR-15 Import | `ImportController` | TEST | `ImportControllerTest` (10 test) |
| FR-16 Audit | `OptimizationRun`, `ProblemHasher` | TEST + PARZIALE | Hash canonico testato; round-trip JSON non testato |
| FR-17 Esiti | `SolverStatus`, `StepStatus` | TEST | `OrToolsSolverRegressionTest`, `SolverRandomizedParityTest` |
| FR-18 AI opzionale | `AiAssistant`, `LlmAiAssistant`, `AiAssistantPanel` | TEST | `LlmAiAssistantTest`, `AiAssistantPanel.test.tsx` |
| FR-19 Multi-obiettivo distinto | `DemoDataLoader` (vettori), `OrToolsSolver` | TEST | `DemoDatasetCoherenceTest`, `MultiObjectiveDiscriminativeTest`, `DemoMultiObjectiveEmpiricalTest` |
| FR-20 Analisi sensibilità budget | `SensitivityService`, `SensitivityController`, `SensitivityPage` | TEST | `SensitivityServiceTest` (13 test), `SensitivityPage.test.tsx` (4 test) |
| FR-21 Vantaggio dell'ottimizzatore | `OrToolsSolver` vs baseline greedy | TEST | `GreedyBaselineComparisonTest` (3 test) |

## Requisiti non funzionali

| NFR | Verifica | Evidenza |
|---|---|---|
| NFR-01 Usabilità | Utente crea e confronta due scenari | MANUALE |
| NFR-02 Isolamento | Test solver senza Spring/DB | TEST (`OrToolsSolverTest`, `SolverEdgeCaseTest`, `GreedyBaselineComparisonTest`) |
| NFR-03 Riproducibilità | Run identici → selezione identica | TEST (`OrToolsSolverRegressionTest`, `SolverRandomizedParityTest`) |
| NFR-04 Interpretabilità | Spiegazioni citano vincoli reali | TEST (`ExplanationServiceTest`, `ExplanationReasonCodeTest`) |
| NFR-05 Sostituibilità | Adapter solver intercambiabili | TEST (`SolverParityTest`, `SolverRandomizedParityTest`, `GreedyBaselineComparisonTest`) |
| NFR-06 Tracciabilità | FR → componente → test | Questa matrice |
| NFR-07 Trasparenza | Natura sintetica visibile | TEST (`DemoDatasetCoherenceTest`) + MANUALE |
| NFR-08 Prestazioni | Run 26 opzioni < 5s | MANUALE |
| NFR-09 Integrità | Snapshot immutabile versionato | PARZIALE — audit immutabile, ma manca `dataRevision` |
| NFR-10 Protezione | Nessun segreto nel repo | Ispezione |

## Copertura per famiglia di test — backend

| Classe | Test | Copertura |
|---|---|---|
| `BruteForceSolverTest` | 12 | Oracle esaustivo: vincoli, tie-break, casi limite |
| `OrToolsSolverTest` | 6 | CP-SAT: budget, incompatibilità, prerequisiti, maxNumber, infeasible |
| `OrToolsSolverRegressionTest` | 10 | Multi-pass, tie-break canonico, stati |
| `SolverParityTest` | 4 | Parità OrTools vs BruteForce (istanze fisse) |
| `SolverEdgeCaseTest` | 8 | Prerequisiti non-candidati, hash canonico, IncludeConstraint |
| `SolverRandomizedParityTest` | 2 | 50 seed × 3 obiettivi = 150 confronti esaustivi + 150 verifiche di auto-consistenza |
| `GreedyBaselineComparisonTest` | 3 | Solver vs greedy: mai peggiore (150 confronti), strettamente migliore (≥1), controesempio knapsack (gap 60%) |
| `MultiObjectiveDiscriminativeTest` | 3 | Obiettivi matematicamente distinti (istanze costruite) |
| `DemoMultiObjectiveEmpiricalTest` | 2 | Obiettivi distinti sul dataset demo reale |
| `DemoDatasetCoherenceTest` | 7 | Coerenza dataset per vettore + non-proporzionalità |
| `ExplanationServiceTest` | 4 | Reason code base |
| `ExplanationReasonCodeTest` | 8 | Reason code nuovi + regressione |
| `SensitivityServiceTest` | 13 | Sweep, stabilità, validazione, determinismo |
| `ImportControllerTest` | 10 | Validazione import, no scritture silenziose |
| `LlmAiAssistantTest` | 10 | Provider LLM fake, fallback, validazione |
| `ScenarioControllerTest` | 2 | `@WebMvcTest` |

**Totale backend**: 104.

## Copertura per famiglia di test — frontend

| Classe | Test | Copertura |
|---|---|---|
| `Dashboard.test.tsx` | 2 | Stato vuoto, principio architetturale |
| `ComparePage.test.tsx` | 2 | Stato vuoto, tabella A vs B |
| `scenarioStore.test.ts` | 3 | Store sessionStorage |
| `AiAssistantPanel.test.tsx` | 8 | Status AI, proposta, apply, reject, errore, fallback |
| `SensitivityPage.test.tsx` | 4 | Form, esecuzione, errore, disabilitazione |

**Totale frontend**: 19.

## Riepilogo

- **TEST**: 21 FR/NFR con copertura automatica (104 + 19 test verdi).
- **MANUALE**: collaudo in `docs/collaudo.md` (Sessioni 1, 2, 3).
- **PARZIALE**: FR-16 (round-trip JSON), NFR-09 (snapshot versionato).