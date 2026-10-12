# API TEPO

Base URL: `http://localhost:8080`.

Tutte le risposte sono JSON. Gli errori restituiscono una struttura leggibile
tramite `GlobalExceptionHandler`.

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
| GET | `/api/map/buildings` | Edifici con coordinate |

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
| `MODEL_INVALID` | Input non conforme |

## Analisi di sensibilità

| Metodo | Path | Descrizione |
|---|---|---|
| POST | `/api/sensitivity/{id}/budget` | Sweep deterministico sul budget |

### Payload

```json
{
  "baseBudgetCents": 50000000,
  "objective": "ENERGY_SAVING",
  "candidateOptionIds": ["OPT-001", "OPT-002"],
  "points": 11,
  "minFactor": 0.5,
  "maxFactor": 1.5
}
```

| Campo | Regola |
|---|---|
| `baseBudgetCents` | ≥ 0 |
| `objective` | Non nullo |
| `candidateOptionIds` | Non vuoto; tutti gli ID devono esistere |
| `points` | `null` → default 11; altrimenti 3–51 |
| `minFactor` | `null` → default 0.5; altrimenti > 0 e < `maxFactor` |
| `maxFactor` | `null` → default 1.5; altrimenti > 0 e > `minFactor` |

**Non persiste nulla. Non chiama il provider LLM. Ogni punto è un `OptimizationProblem` indipendente.**

### Risposta

```json
{
  "objective": "ENERGY_SAVING",
  "baseBudgetCents": 50000000,
  "minBudgetCents": 25000000,
  "maxBudgetCents": 75000000,
  "points": 11,
  "grid": [
    {
      "budgetCents": 25000000,
      "solverStatus": "OPTIMAL",
      "optimalityProven": true,
      "objectiveValue": 12345,
      "totalInvestmentCents": 24000000,
      "remainingBudgetCents": 1000000,
      "numSelected": 4,
      "selectedOptionsId": ["OPT-001", "OPT-002", "OPT-003", "OPT-004"]
    }
  ],
  "alwaysSelected": ["OPT-001"],
  "neverSelected": ["OPT-025"],
  "swing": ["OPT-002", "OPT-003"]
}
```

`alwaysSelected`, `neverSelected`, `swing` sono disgiunti e la loro unione è
l'intero set di candidati.

## Storico esecuzioni

| Metodo | Path | Descrizione |
|---|---|---|
| GET | `/api/runs` | Tutte le esecuzioni |
| GET | `/api/runs/{id}` | Dettaglio per `runId` |
| GET | `/api/runs/scenario/{scenarioId}` | Esecuzioni per scenario |

L'analisi di sensibilità **non** produce righe in questa tabella.

## Import CSV

| Metodo | Path | Descrizione |
|---|---|---|
| POST | `/api/imports/buildings/validate` | Validazione senza scrittura |
| POST | `/api/imports/buildings/commit` | Import dei record validi |

### Header richiesto

```
id,name,address,municipality,latitude,longitude,buildingType,surfaceM2
```

**Campi obbligatori per una riga valida:** `id`, `name`, `address`,
`municipality`, `buildingType` non vuoti; `latitude`, `longitude` numerici;
`surfaceM2` numerico > 0.

Caratteristiche gestite: BOM UTF-8, fine riga LF/CRLF/CR, virgolette con virgole
interne, decimali `.` o `,`, righe vuote ignorate, ID duplicati rifiutati.

**Nessun valore malformato viene convertito silenziosamente in zero.**
Il commit restituisce `skippedDetails` con riga, ID e motivi.

### Payload `validate` / `commit`

```json
{ "content": "id,name,address,…\nBLD-101,…" }
```

### Risposta `commit`

```json
{
  "inserted": 3,
  "skipped": 1,
  "skippedDetails": [
    { "row": 4, "id": "BLD-999", "errors": ["Superficie non valida"] }
  ]
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
  "candidateOptionIds": ["OPT-001", "OPT-002"],
  "explanation": "…",
  "source": "RULE_BASED",
  "missingInformation": [],
  "warnings": [],
  "requiresHumanReview": true
}
```

`source`: `RULE_BASED` | `LLM` | `LLM_FALLBACK_RULE_BASED`.

La proposta non è applicata automaticamente. `requiresHumanReview` è sempre `true`.

### `GET /api/ai/status`

```json
{
  "llmConfigured": false,
  "activeProvider": "rule-based",
  "notes": ["Provider LLM non configurato: …"]
}
```

## OpenAPI

| Metodo | Path | Descrizione |
|---|---|---|
| GET | `/v3/api-docs` | Specifica OpenAPI JSON |
| GET | `/swagger-ui.html` | UI interattiva |

## Convenzioni errori

| Codice | Causa tipica |
|---|---|
| 400 | Validazione fallita (`IllegalArgumentException`) |
| 404 | Risorsa non trovata |
| 500 | Errore interno |

Nessuno stack trace è esposto al client.

## Note

- Nessuna autenticazione: uso locale / demo.
- Le risposte `INFEASIBLE` sono 200 con `solverStatus: "INFEASIBLE"`.
- L'analisi di sensibilità non è considerata "audit" e non compare in `/api/runs`.
