# Strategia di test TEPO

## Filosofia

La suite di test TEPO serve a garantire quattro proprietà:

1. **Correttezza del solver** — l'ottimo restituito è davvero ottimo e rispetta i vincoli.
2. **Determinismo** — due esecuzioni identiche producono lo stesso risultato.
3. **Parità con un oracle indipendente** — il solver di produzione e il brute-force concordano.
4. **Isolamento** — i test unitari non richiedono database, rete o provider esterni.

I test non inseguono una percentuale di copertura. Verificano comportamento,
non esistenza di codice.

## Livelli

| Livello | Dove | Cosa copre | Esempi |
|---|---|---|---|
| **Unit** | `src/test/java/.../optimization/`, `.../application/`, `.../api/` (Mockito) | Logica pura: solver, spiegazioni, parser, servizi | `OrToolsSolverTest`, `SolverEdgeCaseTest`, `ExplanationReasonCodeTest`, `ImportControllerTest`, `RuleBasedAiAssistantTest` |
| **Integration (H2)** | `@SpringBootTest` + profilo `test` | Persistenza, repository, dataset demo | `DemoDatasetCoherenceTest`, `DemoMultiObjectiveEmpiricalTest` |
| **Web (MockMvc)** | `@WebMvcTest` | Contratti HTTP, serializzazione, gestione errori | `ScenarioControllerTest` |
| **Frontend component** | Vitest + Testing Library | Rendering, interazioni utente, mock di rete | `SensitivityPage.test.tsx`, `AiAssistantPanel.test.tsx` |
| **Frontend unit** | Vitest (no DOM) | Store, logica di sessione | `scenarioStore.test.ts` |

Non esiste una suite end-to-end automatizzata (Playwright/Cypress). Il percorso
UI è verificato manualmente in `docs/collaudo.md`. Questa è una scelta
deliberata: aggiungere un browser driver introdurrebbe una dipendenza pesante
per un progetto accademico con UI semplice.

## Convenzioni

- **Nomi in italiano** per test e commenti, coerenti con il resto del progetto.
- **Un file di test per classe di produzione**, con suffisso `Test` (backend) o
  `.test.tsx` / `.test.ts` (frontend).
- **Assertion esplicite**: `assertEquals`, `assertTrue` con messaggio che
  contenga abbastanza contesto per ricostruire l'istanza in caso di fallimento.
- **Nessuna eccezione silenziata**: se un test deve ignorare una condizione,
  lo fa con `assumeTrue(...)` e non con `try/catch` vuoto.
- **Nessuna data/ora reale** nei test. Se serve un timestamp, si usa un valore
  fisso o iniettato.
- **Seed deterministico**: i test randomizzati usano `java.util.Random(seed)`
  con seed esplicito in `[1..50]` o simile, mai `new Random()`.

## Suite backend

**Comando universale (Docker, funziona su qualsiasi OS)**:

```powershell
.\scripts\test-backend.ps1
```

```bash
./scripts/test-backend.sh
```

Esegue `mvn -B clean test` in `maven:3.9-eclipse-temurin-21`, lo stesso
container della CI.

**Totale**: 119 test, tutti verdi (2026-10-17).

| Classe | Test | Copertura |
|---|---|---|
| `BruteForceSolverTest` | 12 | Oracle esaustivo: vincoli, tie-break, casi limite, pitch example |
| `OrToolsSolverTest` | 6 | CP-SAT: budget, incompatibilità, prerequisiti, maxNumber, infeasible |
| `OrToolsSolverRegressionTest` | 10 | Multi-pass, tie-break canonico, distinzione stati `OPTIMAL`/`FEASIBLE`/`UNKNOWN`, timeout |
| `SolverParityTest` | 4 | Parità OrTools vs BruteForce su istanze fisse |
| `SolverEdgeCaseTest` | 8 | Prerequisiti non-candidati, hash canonico, `IncludeConstraint` non-candidata |
| `SolverRandomizedParityTest` | 2 | 50 seed × 3 obiettivi = 150 confronti esaustivi + 150 verifiche di auto-consistenza indipendenti dal solver |
| `GreedyBaselineComparisonTest` | 3 | Solver vs baseline greedy: mai peggiore (150 confronti), strettamente migliore (≥1), controesempio knapsack (gap 60%) |
| `MultiObjectiveDiscriminativeTest` | 3 | Obiettivi matematicamente distinti su istanze costruite a mano |
| `DemoMultiObjectiveEmpiricalTest` | 2 | Obiettivi distinti sui 26 interventi reali su 5 budget |
| `DemoDatasetCoherenceTest` | 7 | Coerenza dataset per vettore energetico + non-proporzionalità |
| `ExplanationServiceTest` | 4 | Reason code base: `SELEZIONATO`, `ESCLUSO_INCOMPATIBILITA`, `ESCLUSO_BUDGET_RESIDUO`, presenza per ogni opzione |
| `ExplanationReasonCodeTest` | 8 | Nuovi reason code (`ESCLUSO_ESPLICITO`, `ESCLUSO_MAX_NUMBER`) + regressione |
| `SensitivityServiceTest` | 13 | Sweep, stabilità, casi limite, validazione, determinismo |
| `ImportControllerTest` | 10 | Validazione import (Mockito), no scritture silenziose |
| `LlmAiAssistantTest` | 10 | Provider LLM fake, fallback deterministico, validazione |
| `RuleBasedAiAssistantTest` | 15 | Parser: 80k, anni (2027), decimali (1,5 milioni), separatori migliaia, contesto debole, default esplicito, objective detection |
| `ScenarioControllerTest` | 2 | `@WebMvcTest` su `/api/scenarios/{id}/optimize` |

### Pattern ricorrenti nel backend

- **Parità di solver**: `SolverParityTest`, `SolverRandomizedParityTest`,
  `GreedyBaselineComparisonTest` confrontano sempre OrTools con un'altra
  implementazione indipendente (brute force o greedy).
- **Istanza riproducibile**: `RandomProblemGenerator` è deterministico e
  produce `toString` completo dell'istanza nei messaggi d'errore.
- **Isolamento unit**: i service testati con `new XxxService(...)` non
  dipendono da Spring. Questo ha richiesto initializer sui campi `@Value`
  (`= 10`, `= 3`, `= 1`), vedi `OptimizationService` e `SensitivityService`.
- **Mock limitati**: Mockito solo per i repository, mai per il solver o
  per il parser. Il solver è sempre reale.

## Suite frontend

**Comando**: `npm test -- --run` da `frontend/`.

**Totale**: 19 test, tutti verdi.

| Classe | Test | Copertura |
|---|---|---|
| `Dashboard.test.tsx` | 2 | Stato vuoto, principio architetturale |
| `ComparePage.test.tsx` | 2 | Stato vuoto, tabella A vs B |
| `scenarioStore.test.ts` | 3 | Store su `sessionStorage` |
| `AiAssistantPanel.test.tsx` | 8 | Status AI locale/LLM, proposta, apply, reject, errore, fallback |
| `SensitivityPage.test.tsx` | 4 | Form, esecuzione, gestione errore, disabilitazione |

### Pattern ricorrenti nel frontend

- **Fetch mockato** con `vi.stubGlobal('fetch', ...)` e handler per URL.
- **Query semantiche** (`getByRole`, `getByLabelText`) preferite a `getByText`
  quando il testo è ambiguo. Vedi fix su `ComparePage.test.tsx`.
- **Nessuna rete reale**: nessun test chiama `http://localhost:8080`.
- **`act()` warning** su componenti che fanno setState dopo await: accettato
  (falso positivo di React 18 in StrictMode), non causa fallimenti.

## Esecuzione test backend su qualsiasi macchina

Tutti i comandi seguenti assumono Docker Desktop avviato.

| OS | Comando |
|---|---|
| Windows PowerShell | `.\scripts\test-backend.ps1` |
| Windows PowerShell (classe singola) | `.\scripts\test-backend.ps1 -Test RuleBasedAiAssistantTest` |
| Linux / macOS | `./scripts/test-backend.sh` |
| Linux / macOS (classe singola) | `./scripts/test-backend.sh RuleBasedAiAssistantTest` |

**Perché Docker e non Maven nativo?**
Il container `maven:3.9-eclipse-temurin-21` è lo stesso usato dalla CI.
Eseguirlo in locale elimina differenze di ambiente (versione JDK, librerie
native, tool di sistema) e rende i risultati riproducibili su ogni OS.

**Eccezione nota**: Windows ARM64. OR-Tools 9.11 non fornisce binari nativi
per `win32-aarch64`. `mvn test` nativo fallisce con 44 errori OR-Tools.
Usa gli script Docker.

Il frontend non ha questo limite: `npm test` e `npm run build` funzionano
nativamente su qualsiasi OS con Node 24.

## Deterministic seed e riproducibilità

`RandomProblemGenerator` usa `new Random(seed)` con seed esplicito. Il test
di parità randomizzato itera su `seed in [1..50]`. Ogni messaggio di
fallimento stampa:

```
--- seed=N objective=OBJ ---
[opzioni con costi/benefici]
[vincoli]
```

Questo è sufficiente per ricostruire l'istanza esatta ed eseguirla in
isolamento.

## Isolamento e dipendenze

| Dipendenza | Nei test unit? | Nei test integration? |
|---|---|---|
| PostgreSQL | no | no (H2 in-memory, profilo `test`) |
| Docker | no | no |
| Provider LLM | no (client fake) | no |
| Rete | no | no |
| `optimization_runs` (audit) | no | no (i test non persistono run) |

I test backend possono essere eseguiti offline (una volta scaricate le
dipendenze Maven nel container). L'unica dipendenza esterna è il registry
Maven per il primo `dependency:go-offline`.

## Warning benigni

Tre warning ricorrenti che **non** indicano problemi e non devono indurre
a modifiche:

1. **Byte Buddy agent dinamico**: `WARNING: A Java agent has been loaded dynamically`.
   Emesso da JaCoCo/Mockito su JDK 21. Comportamento atteso, sarà disabilitato
   per default in JDK futuri.
2. **3 repository Maven non raggiungibili**: `Could not transfer metadata from
   flyway-repo / spring-release / flyway-community-db-support`. Rete aziendale
   o firewall. Non impatta la risoluzione delle dipendenze.
3. **JaCoCo + Java 25**: se si esegue `mvn test` con JVM > 22 nativa, si
   osserva `Unsupported class file major version 69`. Il container
   `maven:3.9-eclipse-temurin-21` non ha questo problema.

## Cosa NON è coperto

- **End-to-end automatico**: nessun browser driver. La verifica del percorso
  UI è manuale (`docs/collaudo.md`).
- **Import CSV su file esterni**: `ImportControllerTest` usa input inline.
- **Provider LLM reale**: richiede credenziali, test separato manuale.
- **Prestazioni**: nessun test misura tempi. Il collaudo manuale verifica
  che 26 opzioni si risolvano in meno di 5 secondi.
- **Concorrenza**: il backend non ha lock espliciti; i test non coprono
  accessi concorrenti.
- **Round-trip JSON di `explanationsJson`**: la serializzazione è testata
  indirettamente, la deserializzazione no.

## Come aggiungere un nuovo test

1. **Scegli il livello** in base a cosa vuoi verificare:
   - logica pura → unit test nella stessa package;
   - interazione con H2/Spring → `@SpringBootTest` + `@ActiveProfiles("test")`;
   - contratto HTTP → `@WebMvcTest` o Mockito su `ImportControllerTest` (più leggero);
   - UI React → Vitest + Testing Library.
2. **Non usare il DB di produzione**: `application-test.yaml` punta a H2.
3. **Non usare dati reali del Comune**: solo il dataset demo (`DemoDataLoader`)
   o istanze sintetiche costruite inline.
4. **Non mockare il solver** in un test che vuole verificarne il
   comportamento: usa `OrToolsSolver` reale con istanze piccole (n ≤ 10).
5. **Riporta numeri concreti** nei commenti quando asserisci valori: es.
   "knapsack cap 10, items (6,10), (5,8), (5,8) → ottimo 16, greedy 10".
6. **Aggiorna `docs/traceability.md`** se il test copre un nuovo requisito o
   un buco precedentemente PARZIALE.

## Comandi di verifica rapida

```powershell
# Backend — tutti i test (Docker, universale)
.\scripts\test-backend.ps1

# Backend — una sola classe (Docker, universale)
.\scripts\test-backend.ps1 -Test GreedyBaselineComparisonTest

# Backend — nativo, solo se JDK 21 + Maven + architettura compatibile
cd backend
mvn -B clean test

# Frontend — tutti i test
cd frontend
npm test -- --run

# Frontend — type-check separato dal build
npx tsc --noEmit

# Frontend — build di produzione
npm run build
```

Esiti attesi (2026-10-17):

- `Tests run: 119, Failures: 0, Errors: 0, Skipped: 0` + `BUILD SUCCESS`
- `Test Files  5 passed`, `Tests  19 passed`
- `tsc` senza output
- `vite build` con `✓ built in …`

## Riferimenti

- `docs/collaudo.md` — collaudo manuale con valori osservati.
- `docs/traceability.md` — matrice requisito → componente → test.
- `docs/audit-report.md` — bug storici e fix con test associato.
- `docs/optimization.md` — formulazione del solver e reason code.
- `scripts/test-backend.ps1`, `scripts/test-backend.sh` — script portabili.
