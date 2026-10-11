# Architettura TEPO

## Vista logica a layer

```
┌─────────────────────────────────────────────────────────────────┐
│  Frontend React + TypeScript + Vite                             │
│  ─ pagine: Dashboard, Mappa, Edifici, Interventi,               │
│             Scenario Builder, Risultato, Confronto, Import      │
│  ─ componenti: AiAssistantPanel, ThemeToggle                    │
│  ─ servizi: api.ts (REST), scenarioStore.ts (sessionStorage)    │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP / JSON
┌────────────────────────▼────────────────────────────────────────┐
│  API REST (Spring MVC)                                          │
│  ─ BuildingController, InterventionController, ScenarioController│
│  ─ MapController, AuditController, ImportController, AiController│
│  ─ GlobalExceptionHandler                                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│  Application (services)                                         │
│  ─ OptimizationService: valida, orchestra, persiste audit       │
│  ─ AiAssistant (RuleBased | LLM): propone parametri             │
└──────┬──────────────────────────────────────┬───────────────────┘
       │                                      │
┌──────▼───────────────┐         ┌────────────▼──────────────────┐
│  Optimization        │         │  Persistence (Spring Data JPA)│
│  ─ OptimizationSolver│         │  ─ BuildingRepository         │
│    ├ OrToolsSolver   │         │  ─ InterventionOptionRepo     │
│    └ BruteForceSolver│         │  ─ InterventionTypeRepo       │
│  ─ ProblemHasher     │         │  ─ OptimizationRunRepository  │
│  ─ ExplanationService│         │  ─ Flyway migrations (V1, V2) │
└──────┬───────────────┘         └────────────┬──────────────────┘
       │                                      │
       │                                      │
┌──────▼───────────┐               ┌──────────▼─────────┐
│  Domain          │               │  PostgreSQL 16     │
│  Building,       │               └────────────────────┘
│  Intervention*,  │
│  Objective,      │
│  OptimizationRun │
└──────────────────┘
```

## Regole architetturali

1. **Il solver è l'unica autorità matematica.** Nessun componente applicativo
   ricalcola il risultato: `OrToolsSolver` produce `OptimizationResult`, gli
   altri lo consumano.
2. **L'LLM non tocca dati né risultati.** Propone solo parametri di scenario,
   validati dal backend, soggetti ad approvazione umana.
3. **La provenienza è esplicita.** Ogni entità porta `DataProvenance`
   (`REAL` / `SYNTHETIC` / `MIXED`). Il dataset demo è interamente `SYNTHETIC`.
4. **Il dominio è sealed.** `ScenarioConstraint` è una `sealed interface` con
   6 varianti. Il solver applica solo vincoli previsti dal modello; varianti
   non riconosciute sono errori, non ignorate silenziosamente.
5. **Determinismo.** CP-SAT con `num_search_workers=1` e `random_seed=0`.
   Tie-break lessicografico a 4 passi. `canonicalTieBreakCompleted` esplicito.
6. **Audit persistente.** Ogni esecuzione salva una riga in `optimization_runs`
   con `run_id`, `problem_hash` canonico, selezioni, esclusioni, spiegazioni.

## Flusso di ottimizzazione

```
POST /api/scenarios/{id}/optimize
  │
  ▼
ScenarioController (validazione DTO)
  │
  ▼
OptimizationService
  ├── valida budget/objective/candidati
  ├── carica InterventionOption dal repository
  ├── verifica esistenza di tutti i candidati
  ├── verifica coerenza BudgetConstraint ↔ budgetCents
  ├── costruisce OptimizationProblem
  ├── invoca OptimizationSolver.solve()
  │     └── OrToolsSolver (multi-pass)
  │           ├── pre-validazione IncludeConstraint non candidato → INFEASIBLE
  │           ├── primary: max obiettivo
  │           ├── secondary: min costo (obiettivo fissato)
  │           ├── secondary: min count (obiettivo + costo fissati)
  │           └── lexicographic: ID crescenti
  ├── ExplanationService.explain()
  ├── persistRun() → optimization_runs
  └── ritorna OptimizationResult
```

## Flusso assistente AI

```
POST /api/ai/propose { text }
  │
  ▼
AiController (validazione @NotBlank, @Size)
  │
  ▼
AiAssistant (RuleBasedAiAssistant | LlmAiAssistant)
  │
  ├─ [LLM] AiProviderProperties → LlmClient.complete(sys, user)
  │         ├─ timeout / HTTP / rete / JSON malformato
  │         └─ fallback rule-based con warning
  │
  ├─ parsing JSON → LlmRawProposal
  ├─ validazione campi (budget > 0, ID nel catalogo, obiettivo noto)
  └─ costruzione ScenarioProposal (source, warnings, missing, requiresHumanReview=true)
  │
  ▼
Frontend AiAssistantPanel
  ├─ evidenzia esclusioni proposte (senza deselezionare)
  ├─ pulsante "Applica" → callback verso ScenarioBuilder
  └─ pulsante "Rifiuta" → pulizia stato
```

## Confini tra componenti

| Componente | Non può fare |
|---|---|
| `ScenarioController` | Calcolare risultati; bypassare `OptimizationService` |
| `OptimizationService` | Applicare vincoli non modellati; ignorare il budget |
| `OrToolsSolver` | Ignorare silenziosamente constraint su ID sconosciuti |
| `ExplanationService` | Affermare cause non deducibili dal risultato |
| `LlmAiAssistant` | Modificare dati, budget, vincoli, o produrre un risultato |
| Frontend | Applicare una proposta AI senza click esplicito |

## Persistenza

- **PostgreSQL 16** con migrazioni Flyway (`V1__init.sql`, `V2__optimization_runs.sql`).
- `optimization_runs` è la tabella di audit. Contiene `run_id` (PK), `scenario_id`,
  `problem_hash` (SHA-256 canonico su contenuto ordinato), `objective`, `budget_cents`,
  metriche aggregate, `selected_options_json`, `excluded_options_json`,
  `explanations_json`, `created_at`.
- **`problem_hash` è calcolato da `ProblemHasher`**: indipendente dall'ordine
  di arrivo di opzioni e vincoli, include solo campi semanticamente rilevanti.
- **NFR-09 (snapshot immutabile versionato)** è parzialmente coperto: ogni run
  è immutabile, ma non esiste ancora una versione esplicita dei dati di input.

## Integrazione AI — separazione

| Livello | Ruolo |
|---|---|
| Frontend `AiAssistantPanel` | Raccoglie testo, mostra proposta, chiede conferma esplicita |
| `AiController` | Valida input, delega a `AiAssistant`, restituisce `ScenarioProposal` |
| `AiAssistant` | Sceglie il motore (rule-based o LLM), applica fallback e validazione |
| `LlmClient` | Comunicazione HTTP con provider esterno, timeouts, errori tipizzati |
| `LlmResponseParser` | Trasforma testo in `LlmRawProposal`, filtra ID validi |

## Gestione errori

- **Backend**: `GlobalExceptionHandler` mappa `IllegalArgumentException` →
  400, `IllegalStateException` → 500, errori runtime → 500 con messaggio
  sintetico. Nessuno stack trace esposto al client.
- **LLM**: `LlmClientException` con `Kind` tipizzato. Se `fallbackOnError=true`,
  la risposta resta valida con `source=LLM_FALLBACK_RULE_BASED` e warning.
- **Frontend**: `AiAssistantPanel` mostra `role="alert"` su errore provider;
  `ScenarioBuilder` mostra errore ottimizzazione in card dedicata.

## Identificativi e hashing

| Campo | Origine | Note |
|---|---|---|
| `run_id` | UUID generato al momento di `solve()` | Uno per esecuzione |
| `problem_hash` | `ProblemHasher.hash(problem)` | SHA-256 su rappresentazione canonica |
| `snapshot_id` | Attualmente pari a `scenarioId` | Migliorabile in futuro |

## Deployment

- **Locale**: 3 processi separati (PostgreSQL in Docker, backend via `mvn spring-boot:run`, frontend via `npm run dev`).
- **Docker Compose**: 3 servizi (`db`, `backend`, `frontend`). Il backend
  usa il profilo `demo` per popolare il dataset. Il frontend è servito da nginx
  con proxy `/api/` verso il backend.
- **CI**: GitHub Actions esegue `mvn clean test` (backend) e
  `npm test && npm run build` (frontend) su push e PR.

## Limiti noti dell'architettura

- Scenari A/B persistiti solo in `sessionStorage`.
- Nessuna autenticazione (contesto locale / demo).
- Nessuna snapshot versionata dei dati di input (NFR-09 parziale).
- `BruteForceSolver` limitato a N ≤ 20 candidati.
