# Collaudo manuale TEPO

## Sessione 1 — 2026-10-09

Ambiente: Windows 11, JDK 21 Temurin 21.0.12.101, Maven 3.9,
Docker Desktop, PostgreSQL 16, Node 24, browser Chrome/Firefox.
Backend avviato con profilo `demo`, dataset 10 edifici / 26 interventi.

### Esito complessivo

Tutti i 15 passi del protocollo di collaudo sono stati superati.
Il flusso end-to-end funziona. Determinismo confermato su 3 run identici.
Console browser senza errori rossi (solo warning benigni di deprecazione
React Router e Firefox MouseEvent).

### Passi verificati

| Passo | Contenuto | Esito | Screenshot |
|---|---|---|---|
| 1 | Dashboard iniziale | OK | `01-dashboard-iniziale.png` |
| 2 | Navigazione topbar | OK | — |
| 3 | Mappa Trento con 10 edifici | OK | `03-mappa-trento.png` |
| 4 | Dettaglio edificio (Ufficio demo 3) | OK | `04-dettaglio-edificio.png` |
| 5 | Tabella Edifici | OK | `05-edifici.png` |
| 6 | Ricerca "scuola" → 3 risultati | OK | `06-ricerca-edifici.png` |
| 7 | Tabella Interventi (26 righe) | OK | `07-interventi.png` |
| 8 | Scenario Builder iniziale | OK | `08-scenario-builder.png` |
| 9 | Configurazione Scenario A (500k) | OK | `09-scenario-a-config.png` |
| 10 | Ottimizzazione A | OK | — |
| 11 | Risultato A (8 interventi, residuo 0) | OK | `11-risultato-a.png` |
| 12 | Salvataggio A | OK | — |
| 13 | Scenario B (1M, 18 interventi) | OK | `13-scenario-b.png` |
| 14 | Confronto A vs B | OK | `14-confronto.png` |
| 15.a | Console aperta | OK | `15-console.png` |
| 15.b | Console senza errori rossi | OK | — |
| 15.c | Determinismo su 3 run identici | OK | — |

### Risultati osservati

Scenario A (budget 500.000 EUR, risparmio energetico):
- Investimento: 500.000 EUR (budget esaurito)
- Budget residuo: 0 EUR
- Risparmio energetico: 301.500 kWh/anno
- Risparmio economico: 60.300 EUR/anno
- CO2 evitata: 75.375 kg/anno
- Interventi selezionati: 8

Scenario B (budget 1.000.000 EUR, risparmio energetico):
- Investimento: 998.000 EUR
- Budget residuo: 2.000 EUR
- Risparmio energetico: 556.500 kWh/anno
- Risparmio economico: 111.300 EUR/anno
- CO2 evitata: 139.125 kg/anno
- Interventi selezionati: 18

B contiene A come sottoinsieme stretto: 10 interventi aggiunti, 0 rimossi.
Il vincolo di incompatibilità OPT-001 ↔ OPT-021 è applicato correttamente.

### Warning residui (non bloccanti)

- React Router v7 future flags (deprecazione annunciata).
- Firefox: `MouseEvent.mozPressure` e `MouseEvent.mozInputSource` deprecati.
- Docker Compose: campo `version` obsoleto nel YAML (da rimuovere).

---

## Sessione 2 — 2026-10-11 (dopo Fase C)

Ambiente: stesso della sessione 1.

### Esito complessivo

Tutti i comandi di verifica passano. Nessuna regressione rispetto alla
sessione 1. Sono state aggiunte le funzionalità di hardening solver e
integrazione AI opzionale.

### Comandi eseguiti

| Comando | Esito | Note |
|---|---|---|
| `mvn -B clean test` | 61/61 verdi | +18 test rispetto a 43 baseline |
| `npm test -- --run` | 15/15 verdi | +8 test frontend |
| `npx tsc --noEmit` | pulito | — |
| `npm run build` | OK | 91 moduli, 374 KB |
| `docker compose config --quiet` | pulito | — |
| `docker compose build --no-cache backend frontend` | OK | ~4 min |

### Novità verificate

**Backend**:
- `SolverEdgeCaseTest` (8 test): prerequisiti non-candidati, hash canonico,
  IncludeConstraint non-candidata.
- `LlmAiAssistantTest` (10 test): client fake, fallback, validazione.
- `ProblemHasher`: SHA-256 canonico su contenuto ordinato.
- Timeout configurabili via `tepo.solver.*`.
- `AiController` con `GET /api/ai/status`.

**Frontend**:
- `AiAssistantPanel.test.tsx` (8 test): status AI, proposta, apply, reject,
  errore, fallback.
- Pannello AI collassabile in `ScenarioBuilder`.
- Evidenziazione esclusi proposti senza deselezione.

### Verifiche manuali raccomandate (non eseguite in questa sessione)

1. Aprire `http://localhost:5173/scenario`.
2. Aprire pannello AI, verificare badge "Modalità locale".
3. Inviare testo "voglio ridurre la CO2 con budget 500k".
4. Verificare proposta con warning "Provider LLM non configurato".
5. Click "Applica allo scenario": budget e obiettivo precompilati, banner visibile.
6. Click "Ottimizza portafoglio": risultato coerente.
7. Ripetere con profilo `llm` e chiave valida (se disponibile): badge "LLM attivo".

### Limiti del collaudo

- `docker compose up -d` completo non eseguito in questa sessione.
- Test con provider LLM reale non eseguito.
- Import CSV con file esterni non rieseguito in questa sessione (verificato
  in sessione precedente).

---

## Problemi noti non bloccanti (aggiornati)

- **P4** — `explanationsJson` serializzato ma senza test di round-trip.
- **P9** — `scenarioId` fisso a `SCN-DEMO`, A/B solo in `sessionStorage`.
- **NFR-09** — Snapshot immutabile non versionato.
- **P10** — `coefficientScale` campo morto in `OptimizationProblem`.
- 8 vulnerabilità transitive in `npm audit` (non risolvibili senza rompere Vite/React).
- `docker-compose.yaml`: `node:25-alpine` nel frontend Dockerfile; `ISTRUZIONI-AVVIO.md`
  cita `node:20`.
- Colori marker Leaflet hardcoded (non seguono il tema scuro).
- FOUC al primo caricamento in dark mode.

---

## Prossime priorità

- Test end-to-end con Docker Compose completo.
- Test di integrazione `OptimizationRunRepository`.
- Persistenza scenari A/B lato backend.
- Allineamento `ISTRUZIONI-AVVIO.md` (percorso `tepodeepseek` → `tepobozza`).