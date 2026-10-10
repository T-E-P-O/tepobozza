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
- Ottimizza il portafoglio con **OR-Tools CP-SAT** (Knapsack / MILP binario).
- Spiega selezioni ed esclusioni con reason code deterministici.
- Confronta scenari (What-If).
- Visualizza gli edifici sulla mappa di Trento.
- Importa edifici da CSV con preview e validazione.
- Espone API REST documentate con Swagger UI.

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

---

## Struttura repository

```
tepodeepseek/
├── backend/                    Backend Spring Boot + solver
│   ├── src/main/java/it/unitn/tepo/
│   │   ├── ai/                 Componente AI opzionale
│   │   ├── api/                Controller REST
│   │   ├── application/        Servizi applicativi e repository
│   │   ├── configuration/      Demo data loader, OpenAPI config
│   │   ├── domain/             Entità e enum
│   │   └── optimization/       Solver, dominio del problema, spiegazioni
│   ├── src/main/resources/
│   │   ├── application.yaml
│   │   └── db/migration/       Migrazioni Flyway (V1, V2)
│   └── src/test/java/          Test automatici (43 verdi)
├── frontend/                   React + Leaflet
│   ├── src/pages/              8 pagine: Dashboard, Mappa, Edifici,
│   │                           Interventi, Scenario, Risultato,
│   │                           Confronto, Import
│   ├── src/services/           API client, scenario store
│   ├── src/test/               Test Vitest (7 verdi)
│   └── Dockerfile
├── docs/                       Documentazione tecnica
│   ├── requirements.md
│   ├── architecture.md
│   ├── domain-model.md
│   ├── optimization.md
│   ├── api.md
│   ├── testing.md
│   ├── traceability.md
│   ├── demo.md
│   ├── collaudo.md
│   ├── data-readiness.md
│   ├── audit-report.md
│   ├── checkpoint.md
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

Da `tepodeepseek/`:

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

Se preferisci avviare tutto con Docker:

```bash
docker compose up --build
```

Atteso: 3 container (`tepo-db`, `tepo-backend`, `tepo-frontend`). Apri `http://localhost:5173`.

---

## Test

### Backend

```bash
cd backend
mvn clean test
```

Atteso: **43 test verdi**.

Copre:
- correttezza del solver (budget, vincoli, obiettivi, casi limite);
- parità OR-Tools vs brute force su istanze piccole;
- determinismo del tie-break multi-pass;
- spiegazioni per ogni reason code;
- coerenza interna del dataset demo (H2 in-memory);
- API controller con `@WebMvcTest`.

### Frontend

```bash
cd frontend
npm test
```

Atteso: **7 test verdi**.

Copre:
- Dashboard (stato vuoto, principio architetturale);
- Confronto scenari (stato vuoto, tabella A vs B);
- Store su sessionStorage.

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
- `x_B ≤ x_A` (prerequisito)
- `Σ x_i ≤ K` (massimo numero)
- `x_i = 1` / `x_i = 0` (inclusione / esclusione)

**Tie-break canonico** (lessicografico):
1. massimizza obiettivo primario;
2. minimizza costo totale;
3. minimizza numero di interventi;
4. preferisce ID crescenti.

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
| POST | `/api/ai/propose` | Proposta AI (opzionale) |
| GET | `/v3/api-docs` | OpenAPI JSON |
| GET | `/swagger-ui.html` | Swagger UI |

Dettagli in `docs/api.md` e nella Swagger UI a runtime.

---

## Componente AI

TEPO funziona **completamente senza LLM**. Il modulo `ai/` contiene:

- `AiAssistant` — interfaccia astratta;
- `RuleBasedAiAssistant` — implementazione default, deterministica, estrae budget e obiettivo da testo libero;
- `LlmAiAssistant` — stub attivabile con profilo `llm` e API key esterna; **non attivo di default**;
- `AiController` — endpoint `POST /api/ai/propose` che restituisce una proposta controllabile, mai eseguita automaticamente.

L'LLM non può modificare dati, vincoli o risultati del solver. Vedi `docs/requirements.md` (FR-18).

---

## Import CSV

L'import accetta file CSV con intestazione:

```
id,name,address,municipality,latitude,longitude,buildingType,surfaceM2
```

**Caratteristiche gestite:**
- BOM UTF-8;
- fine riga LF, CRLF, CR;
- valori tra virgolette con virgole interne;
- separatori decimali `.` o `,`;
- righe vuote ignorate;
- ID duplicati rifiutati;
- latitudine e longitudine validate;
- commit parziale con report esplicito (nessuna scrittura silenziosa).

Esempio valido:

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
| `docs/optimization.md` | Modello matematico, tie-break, reason code |
| `docs/api.md` | Endpoint REST |
| `docs/testing.md` | Strategia di test |
| `docs/traceability.md` | Matrice requisiti → componente → test |
| `docs/demo.md` | Script per la presentazione |
| `docs/collaudo.md` | Protocollo di collaudo (eseguito 2026-10-09) |
| `docs/data-readiness.md` | Fonti dati e stato di disponibilità |
| `docs/audit-report.md` | Audit tecnico e correzioni |
| `docs/checkpoint.md` | Verifica finale e stato di consegna |
| `docs/uml/` | 4 diagrammi PlantUML |
| `docs/screenshot/` | Screenshot delle schermate chiave |

---

## Limiti dichiarati

- Dataset sintetico, non validato dal Comune di Trento.
- Nessuna integrazione con sistemi informativi comunali.
- Singolo orizzonte decisionale (no multi-anno, no scheduling).
- Obiettivo singolo per scenario (no multi-objective, no Pareto).
- Nessuna previsione autonoma dei consumi o dei prezzi.
- L'LLM non è attivo di default; il componente rule-based è deterministico.

Il progetto dimostra il metodo e il processo. L'utilità operativa reale richiede dati forniti dal Comune, validazione tecnica delle stime e revisione umana.

---

## Screenshot

Le schermate principali sono in `docs/screenshot/`:

- `01-dashboard-iniziale.png` — dashboard con catalogo
- `03-mappa-trento.png` — mappa con edifici demo
- `04-dettaglio-edificio.png` — dettaglio edificio e interventi
- `05-edifici.png` — tabella edifici
- `07-interventi.png` — tabella interventi
- `08-scenario-builder.png` — configurazione scenario
- `11a-risultato-kpi.png` — KPI risultato
- `11b-risultato-selezionati.png` — portafoglio selezionato
- `11c-risultato-motivazioni.png` — spiegazioni
- `14a-confronto-tabella.png` — confronto A vs B

---

## Licenza

Progetto accademico — Università degli Studi di Trento. Tutti i diritti riservati ai membri del team.

Il dataset è sintetico. Il progetto non è destinato all'uso in produzione senza validazione tecnica dei dati e del processo con il Comune di Trento.
