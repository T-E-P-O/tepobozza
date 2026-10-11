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
│   └── src/test/java/          Test automatici (61 verdi)
├── frontend/
│   ├── src/pages/              8 pagine: Dashboard, Mappa, Edifici,
│   │                           Interventi, Scenario, Risultato,
│   │                           Confronto, Import
│   ├── src/components/         ThemeToggle, AiAssistantPanel
│   ├── src/services/           API client, scenario store
│   ├── src/styles/             Design tokens, base, componenti
│   ├── src/test/               Test Vitest (15 verdi)
│   └── Dockerfile
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

## Avvio in sviluppo

### Prerequisiti

- **Docker Desktop** installato e in esecuzione.
- **JDK 21** (Temurin raccomandato).
- **Maven 3.9** o superiore.
- **Node.js 20+** e **npm**.

Verifica con:

```bash
docker --version
java --version
mvn --version
node --version
npm --version
```

### 1. Database

Da `tepobozza/`:

```bash
docker compose up -d db
docker compose ps
```

Atteso: `tepo-db` con stato `running (healthy)`. Ci vogliono 10–15 secondi.

### 2. Backend

**Linux / macOS:**

```bash
cd backend
export JAVA_HOME=/path/to/jdk-21
export DB_URL=jdbc:postgresql://localhost:5432/tepo
export DB_USERNAME=tepo
export DB_PASSWORD=tepo
mvn spring-boot:run -Dspring-boot.run.profiles=demo
```

**Windows PowerShell:**

```powershell
cd backend
$env:JAVA_HOME   = "C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot"
$env:Path        = "$env:JAVA_HOME\bin;$env:Path"
$env:DB_URL      = "jdbc:postgresql://localhost:5432/tepo"
$env:DB_USERNAME = "tepo"
$env:DB_PASSWORD = "tepo"
mvn spring-boot:run "-Dspring-boot.run.profiles=demo"
```

Atteso: `Started TepoApplication in X.XXX seconds`.

Il profilo `demo` carica automaticamente il dataset sintetico al primo avvio (10 edifici, 26 interventi). Ai riavvii successivi il dataset non viene duplicato.

Swagger UI: `http://localhost:8080/swagger-ui.html`.

### 3. Frontend

**In un nuovo terminale:**

```bash
cd frontend
npm install
npm run dev
```

Apri `http://localhost:5173`.

### 4. Avvio completo con Docker

```bash
docker compose up --build
```

Atteso: 3 container (`tepo-db`, `tepo-backend`, `tepo-frontend`). Apri `http://localhost:5173`.

### 5. Assistente AI (opzionale)

TEPO funziona **completamente senza LLM**. Il motore di default è
deterministico e rule-based.

Per attivare un provider LLM compatibile OpenAI:

```powershell
$env:SPRING_PROFILES_ACTIVE = "demo,llm"
$env:TEPO_AI_ENABLED        = "true"
$env:LLM_API_KEY            = "<chiave>"
$env:LLM_MODEL              = "gpt-4o-mini"
# opzionale: $env:LLM_API_ENDPOINT = "https://..."
mvn spring-boot:run
```

Se la chiave è assente, ogni chiamata cade nel fallback locale con warning
espliciti. Nessuna chiave è mai committata. Vedi `docs/ai-integration.md`.

---

## Test

### Backend

```bash
cd backend
mvn clean test
```

Atteso: **61 test verdi**.

| Classe | Test | Copertura |
|---|---|---|
| `BruteForceSolverTest` | 12 | Oracle esaustivo: vincoli, tie-break, casi limite |
| `OrToolsSolverTest` | 6 | CP-SAT: budget, incompatibilità, prerequisiti, maxNumber, infeasible |
| `OrToolsSolverRegressionTest` | 10 | Multi-pass, tie-break canonico, stati, timeout |
| `SolverParityTest` | 4 | Parità OrTools vs BruteForce |
| `SolverEdgeCaseTest` | 8 | Prerequisiti vs non-candidati, hash canonico, IncludeConstraint |
| `ExplanationServiceTest` | 4 | Reason code per ogni famiglia |
| `DemoDatasetCoherenceTest` | 5 | Coerenza interna dataset (H2) |
| `LlmAiAssistantTest` | 10 | Provider LLM con client fake, fallback, validazione |
| `ScenarioControllerTest` | 2 | `@WebMvcTest` endpoint scenarios |

### Frontend

```bash
cd frontend
npm test
```

Atteso: **15 test verdi**.

| Classe | Test | Copertura |
|---|---|---|
| `Dashboard.test.tsx` | 2 | Stato vuoto, principio architetturale |
| `ComparePage.test.tsx` | 2 | Stato vuoto, tabella A vs B |
| `scenarioStore.test.ts` | 3 | Store su sessionStorage |
| `AiAssistantPanel.test.tsx` | 8 | Status AI, proposta, apply, reject, errore, fallback |

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

## Dataset demo

10 edifici sintetici con coordinate plausibili a Trento, 6 tipologie di intervento, 26 opzioni.

**Ipotesi sintetiche dichiarate:**

- Tariffa energetica: **0.20 EUR/kWh** (20 cent/kWh);
- Fattore di emissione: **0.25 kg CO2/kWh**;
- Scala: 1:1 per energia (kWh), CO2 (kg), importi (cent);
- Payback demo: **8–25 anni**.

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

**Caratteristiche gestite:** BOM UTF-8, fine riga LF/CRLF/CR, valori tra virgolette con virgole interne, separatori decimali `.` o `,`, righe vuote ignorate, ID duplicati rifiutati, latitudine e longitudine validate, commit parziale con report esplicito (nessuna scrittura silenziosa).

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
| `docs/optimization.md` | Modello matematico, tie-break, reason code, stati |
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

Il progetto dimostra il metodo e il processo. L'utilità operativa reale richiede dati forniti dal Comune, validazione tecnica delle stime e revisione umana.

---

## Licenza

Progetto accademico — Università degli Studi di Trento. Tutti i diritti riservati ai membri del team.

Il dataset è sintetico. Il progetto non è destinato all'uso in produzione senza validazione tecnica dei dati e del processo con il Comune di Trento.
