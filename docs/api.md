# API TEPO

## Edifici

| Metodo | Path | Descrizione |
|---|---|---|
| GET | /api/buildings | Elenco |
| GET | /api/buildings/{id} | Dettaglio |
| POST | /api/buildings | Creazione |
| PUT | /api/buildings/{id} | Aggiornamento |
| DELETE | /api/buildings/{id} | Eliminazione |

## Interventi

| Metodo | Path | Descrizione |
|---|---|---|
| GET | /api/interventions | Elenco (filtro `?buildingId=`) |
| GET | /api/interventions/{id} | Dettaglio |
| POST | /api/interventions | Creazione |
| GET | /api/intervention-types | Elenco tipi |

## Scenari

| Metodo | Path | Descrizione |
|---|---|---|
| GET | /api/scenarios/ping | Health check |
| POST | /api/scenarios/{id}/optimize | Esegue l'ottimizzazione |

### Payload optimize

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