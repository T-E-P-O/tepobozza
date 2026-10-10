# TEPO — Checkpoint verifica finale

Data: 2026-10-10
Ambiente: <SO, versioni di Docker, Java, Maven, Node>

## 1. Stato Git

- Output `git status`: <incollare>
- Modifiche preesistenti preservate: sì / no
- Azioni distruttive eseguite: nessuna

## 2. Build frontend (`npm run build`)

- Comando: `cd frontend && npm run build`
- Esito: success / failure
- Errori TypeScript: <nessuno / elenco>
- Output `dist/`: <file prodotti>
- Anomalie: <elenco o "nessuna">

## 3. Docker build e up

- Comando: `docker compose build && docker compose up -d`
- Esito: success / failure
- Container avviati: <elenco>
- Volumi cancellati: nessuno
- Anomalie: <elenco o "nessuna">

## 4. Stato container e raggiungibilità

- `docker compose ps`: <incollare>
- Log backend (ultime 20 righe): <incollare>
- Log frontend (ultime 20 righe): <incollare>
- `GET /api/buildings`: <count>
- `GET /api/interventions`: <count>
- `GET /api/scenarios/ping`: <risposta>
- `GET /v3/api-docs`: <title>
- Ottimizzazione POST: solverStatus=<...>, optimalityProven=<...>, canonicalTieBreakCompleted=<...>, selected=<...>
- Persistenza dopo restart backend: `/api/runs` count=<...>

## 5. Import CSV

- `test-valid.csv`: valid=<...>, invalid=<...>, inserted=<...>
- `test-malformed.csv`: valid=<...>, invalid=<...>, errori=<elenco>
- `test-with-bom.csv`: valid=<...>, invalid=<...>
- `test-empty.csv`: HTTP status=<...>, messaggio=<...>
- `test-no-header.csv`: HTTP status=<...>, messaggio=<...>
- Pulizia record di test: eseguita / non eseguita

## 6. Matrice requisiti

- Punto 38 (responsive): stato riconciliato = VERIFICATO
- Punto 53 (OpenAPI): stato riconciliato = VERIFICATO (dipende dal passo 4)
- Conteggio originale dei 91 punti: invariato
- Deliverable verificati: <N>
- Deliverable non verificati: <N>
- Deliverable parziali: <N>
- Future work: <N>

## 7. `docs/data-readiness.md`

- Creato / aggiornato
- Sezioni: 8
- Contenuto verificato: sì

## 8. Integrazioni AI/ML/scraping

- LLM attivo: no
- ML attivo: no
- Scraping attivo: no

## 9. Verifiche non eseguite

<elenco con motivazione>

## 10. Anomalie riscontrate

<elenco con passi di riproduzione>

## 11. Conclusione

Stato: <pronto per consegna / da rivedere>

Prossima azione: <una sola>