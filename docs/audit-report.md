# TEPO — Audit Report

## Stato del progetto

MVP completo, testato, con hardening del solver e integrazione AI opzionale
nella Fase C. Test automatici verdi: 61 backend, 15 frontend.

## Controlli eseguiti

| Controllo | Esito effettivo | Data |
|---|---|---|
| `mvn -B clean test` | 61/61 verdi | 2026-10-11 |
| `npm test -- --run` | 15/15 verdi | 2026-10-11 |
| `npx tsc --noEmit` | pulito | 2026-10-11 |
| `npm run build` | OK, 91 moduli, ~374 KB | 2026-10-11 |
| `docker compose config --quiet` | pulito | 2026-10-11 |
| `docker compose build --no-cache backend frontend` | OK | 2026-10-11 |
| `GET /api/buildings` | 10 edifici | — |
| `GET /api/interventions` | 26 interventi, payback 8–25 anni | — |

Ambiente: JDK 21 Temurin 21.0.12.101, Maven 3.9, Docker Desktop, PostgreSQL 16, OR-Tools 9.11.

---

## Criticità risolte

### Fase 2 — Solver e dataset

#### P1 — Tie-break lessicografico (RISOLTO)

**File:** `optimization/OrToolsSolver.java`.

**Prima:** `runLexicographicIds` aggiungeva vincoli progressivamente sullo
stesso `CpModel`, corrompendolo quando il solver ritornava `UNSAT`.

**Dopo:** ad ogni iterazione il metodo ricostruisce integralmente il modello
e applica le forzature accumulate. Se una qualunque iterazione ritorna
`UNKNOWN`, il metodo ritorna `null` e il risultato finale è marcato
`canonicalTieBreakCompleted=false`.

**Test di copertura:** `OrToolsSolverRegressionTest`.

#### P3 — Distinzione stati (RISOLTO)

**File:** `optimization/OrToolsSolver.java`.

**Prima:** `runPrimary` ritornava `null` sia per `INFEASIBLE` sia per
`UNKNOWN`, e il chiamante interpretava `null` come `INFEASIBLE`.

**Dopo:** introduzione di `StepStatus` con quattro valori
(`OPTIMAL`, `FEASIBLE`, `INFEASIBLE`, `UNKNOWN`).

**Test di copertura:** `OrToolsSolverRegressionTest.infeasibleDueTo...`.

#### P8 — Timeout multi-pass (RISOLTO — poi esteso in Fase C)

**File:** `optimization/OrToolsSolver.java`.

Timeout dedicati per fase (costanti hardcoded): primary 10s, secondary 3s,
lexicographic 1s.

**Test di copertura:** nessun test diretto, comportamento osservato in
`OrToolsSolverRegressionTest`.

#### P2 — Unità e dataset (RISOLTO)

**File:** `configuration/DemoDataLoader.java`.

Ipotesi sintetiche esplicite:
- tariffa 0.20 EUR/kWh (20 cent/kWh);
- fattore CO₂ 0.25 kg/kWh;
- scala 1:1 per energia e CO₂;
- payback demo 8–25 anni.

**Test di copertura:** `DemoDatasetCoherenceTest` (5 test).

---

### Fase 3 — Hardening solver e integrazione AI (RISOLTI)

#### B1 — Prerequisiti verso opzioni non-candidate (RISOLTO)

**File:** `optimization/OrToolsSolver.java`.

**Prima:** `if (opt != null && req != null) model.addImplication(x[opt], x[req]);`
— se `requiredOption` non era tra i candidati, la constraint era **ignorata
silenziosamente**. L'opzione dipendente poteva essere selezionata come se il
prerequisito non esistesse. `BruteForceSolver` invece la gestiva correttamente,
producendo una divergenza tra i due solver.

**Dopo:** se `req == null` (prerequisito non candidato), `model.addEquality(x[opt], 0)`.
L'opzione dipendente non può essere selezionata. Parità garantita con
`BruteForceSolver`.

**Test di copertura:** `SolverEdgeCaseTest.prerequisiteToNonCandidateForcesDependentOff`,
`prerequisiteToNonCandidateDoesNotForceInfeasibilityOfWholeScenario`.

#### B2 — IncludeConstraint su opzione non-candidata (RISOLTO)

**File:** `optimization/OrToolsSolver.java`.

**Prima:** `if (idx != null) model.addEquality(x[idx], 1);` — se l'ID non era
candidato, il vincolo "includi Z" **spariva**.

**Dopo:** pre-validazione in `solve()`: se un `IncludeConstraint` ha ID assente
dai candidati, viene restituito `INFEASIBLE` immediatamente. Coerente con
`BruteForceSolver`, che già lo trattava come infeasible.

**Test di copertura:** `SolverEdgeCaseTest.includeNonCandidateIsInfeasible`.

#### B3 — `SolverConfiguration` ignorata (RISOLTO)

**File:** `optimization/SolverConfiguration.java`, `optimization/OrToolsSolver.java`,
`application/OptimizationService.java`, `resources/application.yaml`.

**Prima:** il record `SolverConfiguration` esisteva ma il campo `maxTimeSeconds`
**non veniva mai letto**. Le tre costanti `PRIMARY_TIMEOUT_SECONDS`,
`SECONDARY_TIMEOUT_SECONDS`, `LEXICOGRAPHIC_TIMEOUT_SECONDS` erano hardcoded.

**Dopo:**
- `SolverConfiguration` esteso a 3 campi: `primaryTimeoutSeconds`,
  `secondaryTimeoutSeconds`, `lexicographicTimeoutSeconds`.
- Costruttore retro-compatibile a 1 argomento (`maxTimeSeconds`) mantenuto.
- `OptimizationService` legge da `@Value("${tepo.solver.*}")`.
- `application.yaml` espone `TEPO_SOLVER_PRIMARY_TIMEOUT`, `TEPO_SOLVER_SECONDARY_TIMEOUT`,
  `TEPO_SOLVER_LEX_TIMEOUT`.

**Test di copertura:** comportamento invariato rispetto ai test preesistenti; nessun
test specifico sulla configurabilità (impatto basso).

#### B4 — `problemHash` non canonico (RISOLTO)

**File:** `optimization/ProblemHasher.java` (nuovo).

**Prima:** `Integer.toHexString(problem.hashCode())` — order-sensitive: due
problemi semanticamente identici con candidati in ordine diverso producevano
hash diversi. Peggio: la ricostruzione in `OptimizationService` legge da
`optionRepository.findAllById()` che non garantisce ordine stabile.

**Dopo:** SHA-256 su rappresentazione canonica:
- opzioni ordinate per ID;
- vincoli serializzati in forma canonica e ordinati;
- incompatibilità resa simmetrica (`A,B` == `B,A`);
- `MaxNumberConstraint` con `optionIds` ordinate;
- solo campi semanticamente rilevanti.

**Test di copertura:** 5 test in `SolverEdgeCaseTest`
(`problemHashStableUnderOptionReordering`, `problemHashStableUnderConstraintReordering`,
`problemHashIncompatibilityIsOrderInsensitive`, `problemHashDiffersForDifferentBudgets`,
`bothSolversProduceSameHashForSameProblem`).

#### B5 — Doppio budget incoerente (RISOLTO)

**File:** `application/OptimizationService.java`.

**Prima:** se `constraints` conteneva un `BudgetConstraint` con valore diverso
da `budgetCents`, il vincolo esplicito veniva ignorato in silenzio. Due fonti di
verità per lo stesso vincolo, una delle quali perdeva.

**Dopo:** `OptimizationService` rifiuta con `IllegalArgumentException` esplicito
se `b.budgetCents() != budgetCents`. Se assente, viene aggiunto
automaticamente.

**Test di copertura:** nessun test automatico dedicato (comportamento di servizio,
non di solver). Coperto indirettamente da `ScenarioControllerTest`.

#### Integrazione AI reale (RISOLTO)

**File:** `ai/llm/*` (7 nuovi).

**Prima:** `LlmAiAssistant` era uno **stub** senza chiamata HTTP. Leggeva
`llm.api.key` e delegava sempre al rule-based. Nessun DTO strutturato.
Nessun endpoint di status. Nessuna UI.

**Dopo:**
- `LlmClient` (interfaccia) + `OpenAiCompatibleClient` (RestClient JDK) con
  timeout, gestione errori HTTP, JSON malformato, rete.
- `LlmPromptTemplates` con schema JSON fisso e regole anti-prompt-injection.
- `LlmResponseParser` con parsing robusto (fence markdown tollerate, campi
  opzionali, filtro ID).
- `AiProviderProperties` + `AiConfiguration` (`@Profile("llm")`).
- `LlmAiAssistant` riscritto: validazione server-side, fallback deterministico
  con warning, `ProposalSource` esposto nel DTO.
- `AiController` esteso con `GET /api/ai/status`.
- Frontend: `AiAssistantPanel` con badge sorgente, warning, missing info,
  pulsanti espliciti Applica/Rifiuta. `ScenarioBuilder` evidenzia gli esclusi
  proposti senza deselezionarli.

**Test di copertura:** 10 backend (`LlmAiAssistantTest`, Mockito, zero rete) +
8 frontend (`AiAssistantPanel.test.tsx`).

---

## Criticità aperte

### P4 — `explanationsJson` serializzato ma non testato in round-trip

**File:** `application/OptimizationService.java`.

**Stato:** il campo è serializzato con Jackson (`serializeJson`). Non esiste
ancora un test di round-trip che legga il JSON persistito e lo deserializzi.

**Impatto:** basso (persistenza funzionante, testabilità parziale).

**Prossimo passo:** test di integrazione con `@DataJpaTest` su
`OptimizationRunRepository`.

### P9 — `scenarioId` fisso

**File:** `frontend/src/pages/ScenarioBuilder.tsx`.

**Stato:** tutti i run confluiscono sotto `SCN-DEMO`. Scenari A/B vivono in
`sessionStorage`. Il backend non ha un endpoint CRUD per scenari.

**Impatto:** medio. Documentato come limite esplicito.

**Prossimo passo:** introdurre entità `Scenario` lato backend con CRUD, oppure
accettare il limite per il contesto demo.

### NFR-09 — Snapshot immutabile non versionato

**File:** `domain/OptimizationRun.java`, `db/migration/V2__optimization_runs.sql`.

**Stato:** ogni run è immutabile (`run_id` UUID, `created_at` timestamp), ma
non esiste una versione esplicita dei dati di input (`dataRevision`).

**Impatto:** medio. Documentato in `docs/architecture.md`.

**Prossimo passo:** aggiungere colonna `data_revision` (migrazione additiva) e
campo corrispondente su `Building`, `InterventionType`, `InterventionOption`.

### Documentazione storica da allineare

**File:** `docs/optimization.md`, `docs/api.md`, `docs/traceability.md`,
`docs/collaudo.md`.

**Stato:** contenevano riferimenti a 43 test e non citavano le correzioni di
Fase C.

**Prossimo passo:** risolto in questa stessa sessione (vedi altri documenti).

### P10 — `coefficientScale` campo morto

**File:** `optimization/OptimizationProblem.java`.

**Stato:** dichiarato e mai letto da `OrToolsSolver` né `BruteForceSolver`.
`OptimizationService` lo fissa a `1`.

**Impatto:** cosmetico.

**Prossimo passo:** rimuovere in una sessione dedicata, o documentare come
"riservato per scaling futuro".

---

## Controlli non eseguiti

| Controllo | Motivo | Comando |
|---|---|---|
| `docker compose up -d` end-to-end con health check completo | Eseguito solo `build`, non `up` | `docker compose up -d && docker compose ps` |
| Test con provider LLM reale | Richiede credenziali e consumo token | Manuale, non in CI |
| Import CSV su file esterni reali | Solo dati di test | Manuale |
| Determinismo runtime su 26 opzioni con payload ufficiale | Eseguito 3 run identici in collaudo, non dopo Fase C | Ripetere |

---

## Verifiche di Fase C raccomandate

1. `mvn -B clean test` dopo ogni modifica al solver.
2. `npm test -- --run && npx tsc --noEmit && npm run build` dopo ogni modifica frontend.
3. Confronto A vs B con budget 500k vs 1M, verifica subset.
4. Prova del pannello AI con status "Modalità locale" (nessuna chiave).
5. Prova del pannello AI con profilo `llm` attivo e chiave valida (se disponibile).

---

## Note

- Il progetto è un MVP accademico, non un prodotto in produzione.
- Il dataset demo è sintetico e chiaramente marcato.
- Nessun dato reale del Comune di Trento è incluso.
- L'integrazione AI è opzionale e non è attivata di default.