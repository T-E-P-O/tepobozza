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
Le tre funzioni sono **matematicamente distinte** sul dataset demo
(verificato da `MultiObjectiveDiscriminativeTest` e
`DemoMultiObjectiveEmpiricalTest`).

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
accumulate. Il modello precedente viene scartato.

Se un passo non conclude (`UNKNOWN`), la fase successiva non viene eseguita e
`canonicalTieBreakCompleted` resta `false`.

## Timeout per fase

Configurabili in `application.yaml` sotto `tepo.solver.*`, esposti via env:

| Variabile | Default | Fase |
|---|---|---|
| `TEPO_SOLVER_PRIMARY_TIMEOUT` | 10 s | Obiettivo primario |
| `TEPO_SOLVER_SECONDARY_TIMEOUT` | 3 s | Costo, count |
| `TEPO_SOLVER_LEX_TIMEOUT` | 1 s | Ogni iterazione del tie-break |

I timeout sono letti da `OptimizationService` e `SensitivityService` tramite
`@Value` con initializer di default, per restare utilizzabili anche in test
unitari che istanziano il service con `new`.

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
- **Esclude** `snapshotId`, metadato di sessione.

## Validazione indipendente

`BruteForceSolver` è un oracle indipendente:
- enumera esaustivamente `2^n` combinazioni;
- filtra ammissibili (budget + vincoli);
- applica lo stesso tie-break lessicografico;
- limite `MAX_N = 20`.

È usato in:
- `SolverParityTest` e `SolverEdgeCaseTest` (istanze costruite a mano);
- `SolverRandomizedParityTest` (50 seed × 3 obiettivi = 150 confronti esaustivi,
  più 150 verifiche di auto-consistenza indipendenti dal solver).

## Reason code delle spiegazioni

`ExplanationService` produce spiegazioni deterministiche classificate in due
famiglie.

### Barriere locali (dimostrate)

Verificano cosa accadrebbe **aggiungendo l'opzione al portafoglio corrente**,
senza sostituzioni. Non provano che l'opzione non possa entrare in ogni
portafoglio ammissibile.

| Reason code | Significato |
|---|---|
| `ESCLUSO_ESPLICITO` | L'opzione è nominata da un `ExcludeConstraint` esplicito. |
| `ESCLUSO_INCOMPATIBILITA` | L'aggiunta viola un'incompatibilità con un'opzione già selezionata. |
| `ESCLUSO_PREREQUISITO` | L'aggiunta richiede un prerequisito non selezionato. |
| `ESCLUSO_BUDGET_TOTALE` | L'opzione da sola supera il budget totale dello scenario. |
| `ESCLUSO_MAX_NUMBER` | L'opzione è nello scope di un `MaxNumberConstraint` e il limite è già raggiunto nel portafoglio corrente. |
| `ESCLUSO_BUDGET_RESIDUO` | L'opzione non entra nel budget residuo senza sostituzioni. |

L'ordine in cui le diagnosi vengono tentate è quello della tabella: dal vincolo
più specifico (esclusione esplicita) al più generico (budget residuo).

### Causa non determinata

| Reason code | Significato |
|---|---|
| `ESCLUSO_NON_OTTIMALE` | L'opzione è esclusa dall'ottimo, ma la causa specifica non è deducibile dal solo risultato corrente. Richiederebbe un'analisi controfattuale (ricalcolo forzato `x_i = 1`). |

### Selezioni

| Reason code | Significato |
|---|---|
| `SELEZIONATO` | Selezionato perché contribuisce all'obiettivo e rispetta vincoli e budget. |
| `SELEZIONATO_PREREQUISITO` | Selezionato come prerequisito per un altro intervento **anch'esso selezionato**, pur non contribuendo direttamente all'obiettivo. |

### Limite dichiarato

Le spiegazioni non sostituiscono il giudizio tecnico o amministrativo. Non
promettono una prova di causalità globale.

**Multi-ottimi non rilevati**: se esistono più portafogli con lo stesso valore
ottimo, il solver ne restituisce uno solo e non segnala l'esistenza di
alternative. Non è implementato un rilevatore di equivalenza.

## Analisi di sensibilità sul budget

`SensitivityService` esegue uno **sweep deterministico** sul budget:

- griglia di `N` punti (3 ≤ N ≤ 51), interpolazione lineare tra
  `base × minFactor` e `base × maxFactor`;
- stesso set di candidati, stesso solver (`OrToolsSolver`), stessi timeout;
- ogni punto è un `OptimizationProblem` indipendente;
- **nessuna persistenza**: le run dell'analisi non finiscono in `optimization_runs`;
- **nessuna chiamata LLM**;
- **non è Monte Carlo**: non ci sono ipotesi probabilistiche né campionamenti casuali.

### Output

Per ogni punto:
- `budgetCents`, `solverStatus`, `optimalityProven`, `objectiveValue`,
  `totalInvestmentCents`, `remainingBudgetCents`, `numSelected`, `selectedOptionsId`.

Classificazione delle opzioni su tutta la griglia:
- **alwaysSelected**: presente in tutti i punti;
- **neverSelected**: assente in tutti i punti;
- **swing**: presente in almeno un punto e assente in almeno un altro.

### Limiti dichiarati

- Varia **solo** il budget. Non varia costi, risparmi, fattori di emissione.
- Non presenta intervalli di confidenza né valori attesi probabilistici.
- Non è una previsione: è un'esplorazione del comportamento del solver al
  variare di un parametro di scenario.

## Audit e persistenza

Ogni chiamata a `POST /api/scenarios/{id}/optimize` produce una riga in
`optimization_runs` (vedi `docs/domain-model.md`).

Le chiamate a `POST /api/sensitivity/{id}/budget` **non** persistono nulla.

## Determinismo e riproducibilità

Configurazione CP-SAT: `num_search_workers = 1`, `random_seed = 0`.
Combinata con il tie-break lessicografico a 4 passi e l'hash canonico,
due chiamate identiche producono:
- stesso `selectedOptionsId`;
- stesso `totalInvestmentCents`;
- stesso `objectiveValue`;
- stesso `problemHash`.

Il `runId` cambia (UUID per esecuzione).

## Limiti

- Un obiettivo per scenario. Nessuna combinazione pesata.
- Nessuna Pareto frontier.
- Nessun multi-anno né scheduling.
- `BruteForceSolver` limitato a N ≤ 20.
- `coefficientScale` dichiarato ma non usato.
