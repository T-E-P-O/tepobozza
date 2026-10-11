# API TEPO

Base URL: `http://localhost:8080`.

Tutte le risposte sono JSON. Gli errori restituiscono una struttura
leggibile tramite `GlobalExceptionHandler`.

## Edifici

| Metodo | Path | Descrizione |
|---|---|---|
| GET | `/api/buildings` | Elenco edifici |
| GET | `/api/buildings/{id}` | Dettaglio edificio |
| POST | `/api/buildings` | Creazione |
| PUT | `/api/buildings/{id}` | Aggiornamento |
| DELETE | `/api/buildings/{id}` | Eliminazione |

## Interventi

| Metodo | Path | Descrizione |
|---|---|---|
| GET | `/api/interventions` | Elenco (filtro `?buildingId=`) |
| GET | `/api/interventions/{id}` | Dettaglio |
| POST | `/api/interventions` | Creazione |
| GET | `/api/intervention-types` | Elenco tipi |

## Mappa

| Metodo | Path | Descrizione |
|---|---|---|
| GET | `/api/map/buildings` | Edifici con coordinate per la mappa |

## Scenari

| Metodo | Path | Descrizione |
|---|---|---|
| GET | `/api/scenarios/ping` | Health check |
| POST | `/api/scenarios/{id}/optimize` | Esegue l'ottimizzazione |

### Payload `optimize`

```json
{
  "budgetCents": 50000000,
  "objective": "ENERGY_SAVING",
  "candidateOptionIds": ["OPT-001", "OPT-002"],
  "incompatibilities": [["OPT-001", "OPT-021"]],
  "prerequisites": [["OPT-014", "OPT-013"]],
  "maxNumber": null,
  "maxNumberOptionIds": []
}
```

**Validazioni server-side:**

| Campo | Regola |
|---|---|
| `budgetCents` | ≥ 0; se `BudgetConstraint` è presente tra i vincoli, deve coincidere |
| `objective` | Non nullo; uno tra `ENERGY_SAVING`, `ECONOMIC_SAVING`, `CO2_REDUCTION` |
| `candidateOptionIds` | Non vuoto; tutti gli ID devono esistere nel catalogo |
| `prerequisites` | `[opt, req]`: se `req` non è candidato, `opt` è forzato a 0 |
| `incompatibilities` | `[a, b]`: simmetrica |

### Risposta

```json
{
  "runId": "…",
  "problemHash": "…",
  "selectedOptionsId": ["OPT-001"],
  "excludedOptionsId": ["OPT-002"],
  "totalInvestmentCents": 6000000,
  "remainingBudgetCents": 44000000,
  "objectiveValue": 100,
  "totalEnergySavingScaled": 100,
  "totalEconomicSavingCents": 100,
  "totalCo2ReductionScaled": 100,
  "solverStatus": "OPTIMAL",
  "optimalityProven": true,
  "canonicalTieBreakCompleted": true,
  "explanations": [
    { "optionId": "OPT-001", "reasonCode": "SELEZIONATO", "message": "…" }
  ]
}
```

**Stati del solver:**

| Stato | Significato |
|---|---|
| `OPTIMAL` | Ottimo provato |
| `FEASIBLE` | Ammissibile, ottimalità non provata |
| `INFEASIBLE` | Nessuna soluzione ammissibile |
| `UNKNOWN` | Solver non ha concluso entro il timeout |
| `MODEL_INVALID` | Input non conforme (es. candidati > limite brute force) |

## Storico esecuzioni

| Metodo | Path | Descrizione |
|---|---|---|
| GET | `/api/runs` | Tutte le esecuzioni |
| GET | `/api/runs/{id}` | Dettaglio per `runId` |
| GET | `/api/runs/scenario/{scenarioId}` | Esecuzioni per scenario |

## Import CSV

| Metodo | Path | Descrizione |
|---|---|---|
| POST | `/api/imports/buildings/validate` | Validazione senza scrittura |
| POST | `/api/imports/buildings/commit` | Import dei record validi |

### Header richiesto

```
id,name,address,municipality,latitude,longitude,buildingType,surfaceM2
```

**Caratteristiche gestite:** BOM UTF-8, fine riga LF/CRLF/CR,
virgolette con virgole interne, decimali `.` o `,`, righe vuote ignorate,
ID duplicati rifiutati, latitudine e longitudine validate, commit parziale
con report esplicito (nessuna scrittura silenziosa).

### Payload `validate` / `commit`

```json
{
  "content": "id,name,address,…\nBLD-101,…"
}
```

## Assistente AI

| Metodo | Path | Descrizione |
|---|---|---|
| POST | `/api/ai/propose` | Traduce testo in proposta di scenario |
| GET | `/api/ai/status` | Stato dell'integrazione AI |

### `POST /api/ai/propose`

**Request:**

```json
{ "text": "voglio ridurre la CO2 con budget 500k" }
```

`text`: obbligatorio, non vuoto, max 2000 caratteri.

**Response:**

```json
{
  "budgetCents": 50000000,
  "objective": "CO2_REDUCTION",
  "candidateOptionIds": ["OPT-001", "OPT-002", "…"],
  "explanation": "…",
  "source": "RULE_BASED",
  "missingInformation": [],
  "warnings": [],
  "requiresHumanReview": true
}
```

**`source`**: `RULE_BASED`, `LLM`, o `LLM_FALLBACK_RULE_BASED`.

**Comportamento:** la proposta non è applicata automaticamente. Il client
deve presentarla all'utente per approvazione esplicita. `requiresHumanReview`
è sempre `true`.

**Errori:**
- 400 se `text` è vuoto o > 2000 caratteri.
- 200 con `warnings` non vuoti se il provider LLM non è configurato o in errore
  (il fallback è trasparente).

### `GET /api/ai/status`

**Response:**

```json
{
  "llmConfigured": false,
  "activeProvider": "rule-based",
  "notes": [
    "Provider LLM non configurato: l'assistente usa un motore deterministico locale.",
    "Per attivare l'LLM: profilo Spring 'llm' + variabile LLM_API_KEY."
  ]
}
```

## OpenAPI

| Metodo | Path | Descrizione |
|---|---|---|
| GET | `/v3/api-docs` | Specifica OpenAPI JSON |
| GET | `/swagger-ui.html` | UI interattiva |

## Convenzioni errori

Errori restituiscono JSON leggibile prodotto da `GlobalExceptionHandler`.
Nessuno stack trace è esposto al client.

| Codice | Causa tipica |
|---|---|
| 400 | Validazione fallita (`IllegalArgumentException`) |
| 404 | Risorsa non trovata |
| 500 | Errore interno (`IllegalStateException` o runtime) |

## Note

- Nessuna autenticazione: l'app è destinata a uso locale / demo.
- CORS non configurato: in sviluppo il frontend è servito con proxy Vite;
  in Docker, nginx fa da reverse proxy su `/api/`.
- Le risposte INFEASIBLE sono 200 con `solverStatus: "INFEASIBLE"`, non errori.