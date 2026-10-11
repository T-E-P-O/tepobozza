# Ottimizzazione TEPO

## Formulazione

Variabili decisionali binarie:

```
x_i ∈ {0, 1}   per ogni opzione candidata i
```

### Obiettivo (uno per scenario)

```
max  Σ_i w_i · x_i
```

dove `w_i` dipende dall'obiettivo scelto:

| Obiettivo | `w_i` |
|---|---|
| `ENERGY_SAVING` | `annualEnergySavingScaled_i` |
| `ECONOMIC_SAVING` | `annualEconomicSavingCents_i` |
| `CO2_REDUCTION` | `annualCo2ReductionScaled_i` |

Non viene mai combinata una somma pesata di unità diverse.

### Vincoli

| Vincolo | Forma | Note |
|---|---|---|
| Budget | `Σ cost_i · x_i ≤ B` | Sempre presente |
| Incompatibilità | `x_A + x_B ≤ 1` | Simmetrica |
| Prerequisito (req candidato) | `x_A ⇒ x_req` | Implication CP-SAT |
| Prerequisito (req non candidato) | `x_A = 0` | Forzatura esplicita |
| MaxNumber | `Σ_{i ∈ S} x_i ≤ K` | Su sottoinsieme |
| Include | `x_i = 1` | Su opzione candidata |
| Include su non-candidata | — | Scenario INFEASIBLE, non constraint droppata |
| Exclude | `x_i = 0` | Su opzione candidata |

## Gerarchia a 4 passi (tie-break canonico)

Per garantire risultati deterministici e riproducibili, ogni chiamata al solver
esegue in sequenza:

1. **Massimizza obiettivo primario.**
2. **Fissa l'obiettivo ottimo e minimizza il costo totale.**
3. **Fissa obiettivo e costo ottimi e minimizza il numero di interventi.**
4. **Fissa obiettivo, costo e count ottimi e applica il tie-break lessicografico
   sugli ID crescenti**: per ogni ID ordinato, tenta di forzare `x_i = 1`;
   se infeasible, forza `x_i = 0`.

Ogni passo ricostruisce **integralmente** il `CpModel` e applica le forzature
accumulate. Il modello precedente viene scartato. Questo evita la corruzione
del modello in caso di `UNSAT` intermedio.

Se un passo non conclude (`UNKNOWN`), la fase successiva non viene eseguita e
`canonicalTieBreakCompleted` resta `false`.

## Timeout per fase

Configurabili in `application.yaml` sotto `tepo.solver.*`, esposti via env:

| Variabile | Default | Fase |
|---|---|---|
| `TEPO_SOLVER_PRIMARY_TIMEOUT` | 10 s | Obiettivo primario |
| `TEPO_SOLVER_SECONDARY_TIMEOUT` | 3 s | Costo, count |
| `TEPO_SOLVER_LEX_TIMEOUT` | 1 s | Ogni iterazione del tie-break lessicografico |

I timeout sono letti da `OptimizationService` tramite `@Value` e passati
al solver in un record `SolverConfiguration(primary, secondary, lexicographic)`.

## Stati del solver

| Stato | Significato |
|---|---|
| `OPTIMAL` | Ottimo globale provato |
| `FEASIBLE` | Soluzione ammissibile trovata, ottimalità non dimostrata |
| `INFEASIBLE` | Nessuna soluzione ammissibile |
| `UNKNOWN` | Timeout o interruzione prima di una conclusione |
| `MODEL_INVALID` | Input non conforme (es. `BruteForceSolver` con N > 20) |

Il flag `optimalityProven` riflette lo stato del solo passo primario.

## Hash canonico del problema

`problemHash` è calcolato da `ProblemHasher.hash(problem)`: SHA-256 su una
rappresentazione canonica dell'istanza.

**Proprietà:**
- Indipendente dall'ordine di arrivo di `candidateOptions` e `constraints`.
- Simmetrica rispetto all'ordine di `IncompatibilityConstraint(A,B)` vs `(B,A)`.
- Ordina gli `optionIds` di `MaxNumberConstraint`.
- Include solo campi semanticamente rilevanti: `schemaVersion`, `objective`,
  `budgetCents`, `coefficientScale`, opzioni e vincoli.
- **Esclude** `snapshotId`, che è metadato di sessione e non di contenuto.

`snapshotId` è attualmente pari a `scenarioId` e non contribuisce al calcolo.

## Validazione indipendente

`BruteForceSolver` è un oracle indipendente:
- enumera esaustivamente `2^n` combinazioni;
- filtra ammissibili (budget + vincoli);
- applica lo stesso tie-break lessicografico;
- limite `MAX_N = 20`.

È usato in `SolverParityTest` e `SolverEdgeCaseTest` per confrontare le
decisioni rispetto a `OrToolsSolver` su istanze piccole.

## Reason code delle spiegazioni

`ExplanationService` produce spiegazioni deterministiche classificate in due
famiglie.

### Barriere locali (dimostrate)

Verificano cosa accadrebbe **aggiungendo l'opzione al portafoglio corrente**,
senza sostituzioni. Non provano che l'opzione non possa entrare in ogni
portafoglio ammissibile.

| Reason code | Significato |
|---|---|
| `ESCLUSO_INCOMPATIBILITA` | L'aggiunta viola un'incompatibilità con un'opzione già selezionata. |
| `ESCLUSO_PREREQUISITO` | L'aggiunta richiede un prerequisito non selezionato. |
| `ESCLUSO_BUDGET_TOTALE` | L'opzione da sola supera il budget totale dello scenario. |
| `ESCLUSO_BUDGET_RESIDUO` | L'opzione non entra nel budget residuo senza sostituzioni. |

### Causa non determinata

| Reason code | Significato |
|---|---|
| `ESCLUSO_NON_OTTIMALE` | L'opzione è esclusa dall'ottimo, ma la causa specifica non è deducibile dal solo risultato corrente. Richiederebbe un'analisi controfattuale (ricalcolo forzato `x_i = 1`). |

### Selezioni

| Reason code | Significato |
|---|---|
| `SELEZIONATO` | Selezionato perché contribuisce all'obiettivo e rispetta vincoli e budget. |
| `SELEZIONATO_PREREQUISITO` | Selezionato come prerequisito per un altro intervento, pur non contribuendo direttamente all'obiettivo (benefici nulli). |

### Limite dichiarato

Le spiegazioni non sostituiscono il giudizio tecnico o amministrativo. Non
promettono una prova di causalità globale. La distinzione tra barriera locale
e causa non determinata è esplicita nel codice e nei test.

## Audit e persistenza

Ogni chiamata al solver produce una riga in `optimization_runs`:

| Campo | Contenuto |
|---|---|
| `run_id` | UUID generato al momento di `solve()` |
| `scenario_id` | Identificativo dello scenario (attualmente `SCN-DEMO`) |
| `problem_hash` | Hash canonico |
| `snapshot_id` | Attualmente pari a `scenario_id` |
| `objective` | Obiettivo scelto |
| `budget_cents` | Budget in cent |
| `total_investment_cents` | Investimento totale |
| `remaining_budget_cents` | Budget − investimento |
| `objective_value` | Valore dell'obiettivo raggiunto |
| `total_energy_saving` | Risparmio energetico totale |
| `total_economic_saving_cents` | Risparmio economico totale |
| `total_co2_reduction` | Riduzione CO2 totale |
| `solver_status` | Stato del solver |
| `optimality_proven` | Flag |
| `canonical_tie_break_completed` | Flag |
| `selected_options_json` | Lista ID selezionati (JSON) |
| `excluded_options_json` | Lista ID esclusi (JSON) |
| `explanations_json` | Lista spiegazioni (JSON) |
| `created_at` | Timestamp |

**Nota:** il round-trip di `explanations_json` (serializzazione →
deserializzazione) non è ancora coperto da test automatici.

## Determinismo e riproducibilità

Configurazione CP-SAT:

- `num_search_workers = 1`
- `random_seed = 0`

Combinata con il tie-break lessicografico a 4 passi e con l'hash canonico,
questo garantisce che due chiamate identiche sullo stesso problema producano:

- stesso `selectedOptionsId` (stesso ordine canonico);
- stesso `totalInvestmentCents`;
- stesso `objectiveValue`;
- stesso `problemHash`.

Il `runId` resta diverso (UUID per esecuzione).

Verificato manualmente su 3 run identici (collaudo 2026-10-09) e coperto da
`OrToolsSolverRegressionTest.tieBreakDeterministicAcrossRuns`.

## Limiti

- Un obiettivo per scenario. Nessuna combinazione pesata.
- Nessuna Pareto frontier.
- Nessun multi-anno né scheduling.
- `BruteForceSolver` limitato a N ≤ 20.
- `coefficientScale` in `OptimizationProblem` è campo dichiarato ma non usato;
  riservato per scaling futuro.
