# TEPO — Trento Energy Portfolio Optimizer

[![CI](https://github.com/mirconegri/tepobozza/actions/workflows/ci.yml/badge.svg)](https://github.com/mirconegri/tepobozza/actions/workflows/ci.yml)

Decision Support System per la selezione di portafogli di interventi di efficientamento energetico sugli edifici comunali.

**Principio architetturale:** L'AI propone. L'utente confronta. Il Comune decide.

**Dataset:** DEMO — dati sintetici. Nessun dato reale del Comune di Trento è incluso.

---

## Cos'è TEPO

TEPO aiuta il Comune di Trento a rispondere a una domanda specifica:

> Dato un insieme di interventi energetici già individuati dai servizi tecnici,
> un budget limitato e una serie di vincoli, quale combinazione di interventi
> massimizza l'obiettivo scelto?

TEPO **non** progetta interventi, **non** stima costi o benefici, **non** prende decisioni amministrative. Organizza candidati, valida scenari, applica vincoli, ottimizza, confronta e spiega. La decisione finale resta umana.

Progetto accademico — Università degli Studi di Trento, corso di Ingegneria del Software, A.A. 2026/2027, nell'ambito dell'iniziativa "100 progetti per il Comune di Trento".

**Team:** Mirco Negri, Gabriele Duca, Riccardo Scheda.

---

## Cosa fa

- Gestisce edifici, tipologie e opzioni di intervento con provenienza dati esplicita.
- Crea scenari con budget, obiettivo (energia / economia / CO2) e vincoli.
- Ottimizza il portafoglio con **OR-Tools CP-SAT** (Knapsack / MILP binario), multi-pass con tie-break lessicografico canonico.
- Spiega selezioni ed esclusioni con reason code deterministici.
- Confronta scenari (What-If).
- Visualizza gli edifici sulla mappa di Trento.
- Importa edifici da CSV con preview e validazione.
- Espone API REST documentate con Swagger UI.
- Offre un assistente AI **opzionale** che propone parametri di scenario da linguaggio naturale. L'AI non calcola risultati e non applica nulla senza approvazione umana.
- Esegue analisi di sensibilità deterministica sul budget (sweep su griglia configurabile, non Monte Carlo).

**Fuori dall'MVP:** IoT, digital twin, previsione dei consumi, monitoraggio post-intervento, pianificazione multi-anno, Pareto frontier, integrazione con sistemi comunali. Elencati come Future Work in `docs/requirements.md`.

---

## Stack

| Livello | Tecnologia |
|---|---|
| Backend | Java 21, Spring Boot 3.3.4, Spring Data JPA, Bean Validation |
| Database | PostgreSQL 16, Flyway per migrazioni |
| Ottimizzazione | Google OR-Tools CP-SAT 9.11 |
| Import CSV | Apache Commons CSV 1.11 |
| Documentazione API | springdoc-openapi 2.6 (Swagger UI) |
| Frontend | React 18, TypeScript, Vite, React Router, Leaflet + React Leaflet |
| Test backend | JUnit 5, Mockito, H2 in-memory |
| Test frontend | Vitest, Testing Library |
| Infrastruttura | Docker Compose |
| AI (opzionale) | Client HTTP compatibile OpenAI, prompt strutturato, fallback deterministico |

---

## Struttura repository

```
tepobozza/
├── backend/
│   ├── src/main/java/it/unitn/tepo/
│   │   ├── ai/                 Assistente AI (interfaccia + rule-based + LLM)
│   │   │   └── llm/            Provider LLM, prompt, parsing
│   │   ├── api/                Controller REST
│   │   ├── application/        Servizi applicativi e repository
│   │   ├── configuration/      Demo data loader, OpenAPI config
│   │   ├── domain/             Entità e enum
│   │   └── optimization/       Solver, dominio del problema, spiegazioni, hasher canonico
│   ├── src/main/resources/
│   │   ├── application.yaml
│   │   └── db/migration/       Migrazioni Flyway (V1, V2)
│   └── src/test/java/          Test automatici (119 verdi)
├── frontend/
│   ├── src/pages/              9 pagine: Dashboard, Mappa, Edifici,
│   │                           Interventi, Scenario, Risultato,
│   │                           Confronto, Sensibilità, Import
│   ├── src/components/         ThemeToggle, AiAssistantPanel
│   ├── src/services/           API client, scenario store
│   ├── src/styles/             Design tokens, base, componenti
│   ├── src/test/               Test Vitest (19 verdi)
│   └── Dockerfile
├── scripts/
│   ├── test-backend.ps1        Test backend via Docker (Windows)
│   └── test-backend.sh         Test backend via Docker (Linux/macOS)
├── docs/                       Documentazione tecnica
│   ├── requirements.md
│   ├── architecture.md
│   ├── domain-model.md
│   ├── optimization.md
│   ├── api.md
│   ├── ai-integration.md
│   ├── testing.md
│   ├── traceability.md
│   ├── demo.md
│   ├── collaudo.md
│   ├── data-readiness.md
│   ├── audit-report.md
│   ├── checkpoint.md
│   ├── design-system.md
│   ├── screenshot/
│   └── uml/
├── docker-compose.yaml
├── .env.example
├── .gitignore
├── ISTRUZIONI-AVVIO.md
└── README.md
```

---

## Avvio

### Percorso primario: Docker Compose (funziona su qualsiasi OS)

**Requisiti**: solo Docker Desktop installato e avviato.

```bash
docker compose up --build
```

Atteso dopo ~30-40 s:
- `tepo-db` → `healthy`
- `tepo-backend` → `healthy` (attende Flyway + OR-Tools)
- `tepo-frontend` → `healthy`

Apri (http://localhost:5173)[http://localhost:5173].

**Funziona su**:
- Windows x86_64
- **Windows ARM64** (Snapdragon/Qualcomm) — caso in cui `mvn test` nativo
  non può eseguire OR-Tools perché non esistono binari nativi per
  `win32-aarch64`. Usa `.\scripts\test-backend.ps1` per i test.
- Linux x86_64/ARM64
- macOS Intel/Apple Silicon

Per fermare: `docker compose down` (mantiene il DB). Per cancellare anche il DB: `docker compose down -v`.

### Percorso sviluppo: nativo con hot-reload

Richiede JDK 21, Maven 3.9, Node 24, e PostgreSQL (o solo il container `db`).

**Linux / macOS / Windows x86_64**:

```bash
# 1. Database (solo il container)
docker compose up -d db

# 2. Backend
cd backend
export JAVA_HOME=/path/to/jdk-21
export DB_URL=jdbc:postgresql://localhost:5432/tepo
export DB_USERNAME=tepo
export DB_PASSWORD=tepo
mvn spring-boot:run -Dspring-boot.run.profiles=demo

# 3. Frontend (in un nuovo terminale)
cd frontend
npm install
npm run dev
```

Atteso: `Started TepoApplication` + `Local: http://localhost:5173/`.

Il profilo `demo` carica automaticamente il dataset sintetico al primo avvio (10 edifici, 26 interventi). Ai riavvii successivi il dataset non viene duplicato.

Swagger UI: `http://localhost:8080/swagger-ui.html`.

### Assistente AI (opzionale)

TEPO funziona **completamente senza LLM**. Il motore di default è deterministico e rule-based.

Per attivare un provider LLM compatibile OpenAI:

```powershell
$env:SPRING_PROFILES_ACTIVE = "demo,llm"
$env:TEPO_AI_ENABLED        = "true"
$env:LLM_API_KEY            = "<chiave>"
$env:LLM_MODEL              = "gpt-4o-mini"
mvn spring-boot:run
```

Se la chiave è assente, ogni chiamata cade nel fallback locale con warning espliciti. Nessuna chiave è mai committata. Vedi `docs/ai-integration.md`.

---

## Test

### Backend

**Metodo universale (consigliato, funziona su qualsiasi OS con Docker)**:

```powershell
.\scripts\test-backend.ps1
```

```bash
./scripts/test-backend.sh
```

Esegue `mvn -B clean test` in `maven:3.9-eclipse-temurin-21`, lo **stesso ambiente della CI**.

**Metodo diretto (Linux / macOS / Windows x86_64 con Java 21 + Maven)**:

```bash
cd backend
mvn clean test
```

**Non funziona su Windows ARM64**: OR-Tools 9.11 non distribuisce binari nativi per `win32-aarch64`.

Atteso: **119 test verdi**.

| Classe | Test | Copertura |
|---|---|---|
| `BruteForceSolverTest` | 12 | Oracle esaustivo: vincoli, tie-break, casi limite |
| `OrToolsSolverTest` | 6 | CP-SAT: budget, incompatibilità, prerequisiti, maxNumber, infeasible |
| `OrToolsSolverRegressionTest` | 10 | Multi-pass, tie-break canonico, stati |
| `SolverParityTest` | 4 | Parità OrTools vs BruteForce (istanze fisse) |
| `SolverEdgeCaseTest` | 8 | Prerequisiti non-candidati, hash canonico, IncludeConstraint |
| `SolverRandomizedParityTest` | 2 | 50 seed × 3 obiettivi = 150 confronti esaustivi |
| `GreedyBaselineComparisonTest` | 3 | Solver vs baseline greedy |
| `MultiObjectiveDiscriminativeTest` | 3 | Obiettivi matematicamente distinti |
| `DemoMultiObjectiveEmpiricalTest` | 2 | Obiettivi distinti sul dataset demo |
| `DemoDatasetCoherenceTest` | 7 | Coerenza dataset per vettore |
| `ExplanationServiceTest` | 4 | Reason code base |
| `ExplanationReasonCodeTest` | 8 | Reason code nuovi + regressione |
| `SensitivityServiceTest` | 13 | Sweep, stabilità, validazione, determinismo |
| `ImportControllerTest` | 10 | Validazione import, no scritture silenziose |
| `LlmAiAssistantTest` | 10 | Provider LLM fake, fallback, validazione |
| `RuleBasedAiAssistantTest` | 15 | Parser: 80k, anni, decimali, default |
| `ScenarioControllerTest` | 2 | `@WebMvcTest` |

### Frontend

```bash
cd frontend
npm test
```

Atteso: **19 test verdi**.

| Classe | Test | Copertura |
|---|---|---|
| `Dashboard.test.tsx` | 2 | Stato vuoto, principio architetturale |
| `ComparePage.test.tsx` | 2 | Stato vuoto, tabella A vs B |
| `scenarioStore.test.ts` | 3 | Store su sessionStorage |
| `AiAssistantPanel.test.tsx` | 8 | Status AI, proposta, apply, reject, errore, fallback |
| `SensitivityPage.test.tsx` | 4 | Form, esecuzione, errore, disabilitazione |

### Build frontend

```bash
cd frontend
npm run build
```

Atteso: `tsc` pulito, `vite build` senza errori.

---

## Modello matematico

Variabili binarie `x_i ∈ {0,1}` per ogni intervento candidato.

**Obiettivo** (uno per scenario):
- `max Σ energySaving_i · x_i` (risparmio energetico)
- `max Σ economicSaving_i · x_i` (risparmio economico)
- `max Σ co2Reduction_i · x_i` (riduzione CO2)

Le tre funzioni sono matematicamente distinte sul dataset demo: le opzioni
sono associate a due vettori energetici scorrelati (elettricità, gas).

**Vincoli**:
- `Σ cost_i · x_i ≤ B` (budget)
- `x_A + x_B ≤ 1` (incompatibilità)
- `x_A ⇒ x_req` (prerequisito; se il prerequisito non è candidato, `x_A = 0`)
- `Σ x_i ≤ K` (massimo numero)
- `x_i = 1` / `x_i = 0` (inclusione / esclusione; `IncludeConstraint` su opzione non candidata ⇒ INFEASIBLE)

**Tie-break canonico** (lessicografico a 4 passi):
1. massimizza obiettivo primario;
2. minimizza costo totale;
3. minimizza numero di interventi;
4. preferisce ID crescenti.

Il flag `canonicalTieBreakCompleted` è `true` solo se tutti i passi sono
terminati. Il flag `optimalityProven` riflette lo stato del passo primario.
Stati distinti: `OPTIMAL`, `FEASIBLE`, `INFEASIBLE`, `UNKNOWN`, `MODEL_INVALID`.

Timeout per fase configurabili in `application.yaml` sotto `tepo.solver.*`.

Dettagli in `docs/optimization.md`.

---

## Analisi di sensibilità

Sweep deterministico sul budget: `N` punti (3–51) tra `base × minFactor` e
`base × maxFactor`, con lo stesso set di candidati e lo stesso solver.

- Non è Monte Carlo: nessuna ipotesi probabilistica, nessun campionamento.
- Non persiste: le run dell'analisi non finiscono in `optimization_runs`.
- Non chiama LLM.
- Classifica ogni opzione in `alwaysSelected` / `neverSelected` / `swing`.

UI dedicata in `/sensitivity`. Endpoint: `POST /api/sensitivity/{id}/budget`.

---

## Dataset demo

10 edifici sintetici con coordinate plausibili a Trento, 6 tipologie di intervento, 26 opzioni.

**Ipotesi sintetiche dichiarate:**

- Due vettori energetici:
  - Elettricità (LED, FV): **0.25 EUR/kWh**, **0.10 kg CO2/kWh** (ipotesi non calibrata, vedi `docs/audit-report.md`);
  - Gas metano (involucro, impianti): **0.10 EUR/kWh**, **0.20 kg CO2/kWh**.
- Scala: 1:1 per energia (kWh), CO2 (kg), importi (cent);
- Payback demo: 5–25 anni per la maggior parte degli interventi.

Tutti i dati sono marcati `SYNTHETIC` in dominio e visibili come "DEMO — dati sintetici" nell'interfaccia.

**Nessun dato reale del Comune di Trento è incluso.** Il dataset è sintetico e viene fornito esclusivamente per scopi didattici.

Vedi `docs/domain-model.md` e `docs/data-readiness.md` per i dettagli.

---

## Endpoint API principali

| Metodo | Path | Descrizione |
|---|---|---|
| GET | `/api/buildings` | Elenco edifici |
| GET | `/api/buildings/{id}` | Dettaglio edificio |
| POST | `/api/buildings` | Creazione edificio |
| PUT | `/api/buildings/{id}` | Aggiornamento edificio |
| DELETE | `/api/buildings/{id}` | Eliminazione edificio |
| GET | `/api/interventions` | Elenco interventi (filtro `?buildingId=`) |
| GET | `/api/interventions/{id}` | Dettaglio intervento |
| GET | `/api/intervention-types` | Elenco tipologie |
| POST | `/api/scenarios/{id}/optimize` | Esecuzione ottimizzazione |
| POST | `/api/sensitivity/{id}/budget` | Sweep deterministico del budget |
| POST | `/api/imports/buildings/validate` | Validazione CSV senza scrittura |
| POST | `/api/imports/buildings/commit` | Import CSV validi |
| GET | `/api/runs` | Storico esecuzioni |
| GET | `/api/runs/scenario/{scenarioId}` | Storico per scenario |
| GET | `/api/map/buildings` | Edifici per mappa |
| POST | `/api/ai/propose` | Proposta AI (validata, mai applicata automaticamente) |
| GET | `/api/ai/status` | Stato integrazione AI (LLM configurato o rule-based) |
| GET | `/v3/api-docs` | OpenAPI JSON |
| GET | `/swagger-ui.html` | Swagger UI |

Dettagli in `docs/api.md` e nella Swagger UI a runtime.

---

## Componente AI

TEPO funziona **completamente senza LLM**. Il modulo `ai/` contiene:

- `AiAssistant` — interfaccia astratta;
- `RuleBasedAiAssistant` — implementazione default (`@Primary`), deterministica;
- `LlmAiAssistant` — attivabile con profilo `llm` e API key esterna;
- `LlmClient` / `OpenAiCompatibleClient` — client HTTP configurabile;
- `LlmPromptTemplates` — prompt in italiano con schema JSON fisso;
- `LlmResponseParser` — parsing robusto e validazione;
- `AiController` — `POST /api/ai/propose` (proposta) e `GET /api/ai/status`.

L'LLM non può modificare dati, vincoli o risultati del solver. Ogni proposta
richiede approvazione umana esplicita. Vedi `docs/ai-integration.md` e
`docs/requirements.md` (FR-18).

---

## Import CSV

L'import accetta file CSV con intestazione:

```
id,name,address,municipality,latitude,longitude,buildingType,surfaceM2
```

**Campi obbligatori per una riga valida:** `id`, `name`, `address`,
`municipality`, `buildingType` non vuoti; `latitude`, `longitude` numerici;
`surfaceM2` numerico > 0.

**Caratteristiche gestite:** BOM UTF-8, fine riga LF/CRLF/CR, valori tra
virgolette con virgole interne, separatori decimali `.` o `,`, righe vuote
ignorate, ID duplicati rifiutati.

**Nessun valore malformato viene convertito silenziosamente in zero.** Il
commit restituisce `skippedDetails` con riga, ID e motivi.

Esempio:

```csv
id,name,address,municipality,latitude,longitude,buildingType,surfaceM2
BLD-101,Scuola nuova,Via Roma 5,Trento,46.0683,11.1206,Scuola,2200
```

Dettagli in `docs/api.md`.

---

## Documentazione

| Documento | Contenuto |
|---|---|
| `docs/requirements.md` | Requisiti funzionali e non funzionali |
| `docs/architecture.md` | Architettura a layer |
| `docs/domain-model.md` | Entità del dominio e invarianti |
| `docs/optimization.md` | Modello matematico, tie-break, reason code, stati, sensibilità |
| `docs/api.md` | Endpoint REST |
| `docs/ai-integration.md` | Provider LLM, configurazione, human-in-the-loop, test |
| `docs/testing.md` | Strategia di test |
| `docs/traceability.md` | Matrice requisiti → componente → test |
| `docs/demo.md` | Script per la presentazione |
| `docs/collaudo.md` | Protocollo di collaudo |
| `docs/data-readiness.md` | Fonti dati e stato di disponibilità |
| `docs/audit-report.md` | Audit tecnico e correzioni |
| `docs/checkpoint.md` | Verifica finale e stato di consegna |
| `docs/design-system.md` | Design system, token, temi |
| `docs/uml/` | 4 diagrammi PlantUML |
| `docs/screenshot/` | Screenshot delle schermate chiave |

---

## Limiti dichiarati

- Dataset sintetico, non validato dal Comune di Trento.
- Nessuna integrazione con sistemi informativi comunali.
- Singolo orizzonte decisionale (no multi-anno, no scheduling).
- Obiettivo singolo per scenario (no multi-objective, no Pareto).
- Nessuna previsione autonoma dei consumi o dei prezzi.
- L'LLM è opzionale e non è attivo di default; il motore rule-based è deterministico.
- Scenari A/B persistiti solo in `sessionStorage` (limite noto).
- Analisi di sensibilità solo sul budget, deterministica, non probabilistica.

Il progetto dimostra il metodo e il processo. L'utilità operativa reale richiede dati forniti dal Comune, validazione tecnica delle stime e revisione umana.

---

## Licenza

Progetto accademico — Università degli Studi di Trento. Tutti i diritti riservati ai membri del team.

Il dataset è sintetico. Il progetto non è destinato all'uso in produzione senza validazione tecnica dei dati e del processo con il Comune di Trento.
