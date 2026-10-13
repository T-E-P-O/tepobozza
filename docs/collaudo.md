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
- Investimento: 500.000 EUR
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

- React Router v7 future flags.
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
- `AiAssistantPanel.test.tsx` (8 test).
- Pannello AI collassabile in `ScenarioBuilder`.
- Evidenziazione esclusi proposti senza deselezione.

### Limiti del collaudo

- `docker compose up -d` completo non eseguito in questa sessione.
- Test con provider LLM reale non eseguito.
- Import CSV con file esterni non rieseguito in questa sessione.

---

## Sessione 3 — 2026-10-13 (dopo Fase E)

Ambiente: Windows 11, JDK 21 Temurin 21.0.12.101, Maven 3.9,
Docker Desktop, PostgreSQL 16.15, Node 20+/npm, browser Chrome/Firefox.
Backend avviato con profilo `demo`.

Commit verificato: `9e786f48d69b77d0c0f7811991aa2c9652cf7c62`.

### Esito complessivo

Tutti i comandi di verifica passano. Multi-obiettivo dimostrato empiricamente
sul dataset demo dopo la correzione dei vettori energetici. Determinismo
confermato nuovamente dopo Fase C e Fase E. Deployment Docker Compose
end-to-end verificato.

### Comandi eseguiti

| Comando | Esito | Note |
|---|---|---|
| `git rev-parse HEAD` | `9e786f4...` | Coincide con commit atteso |
| `git status --short` | vuoto | Working tree pulito |
| `mvn -B clean test` | **104/104 verdi** | +43 rispetto a Sessione 2 |
| `docker compose ps` (solo db) | `tepo-db` healthy | PostgreSQL 16.15 |
| `mvn spring-boot:run -Dspring-boot.run.profiles=demo` | `Started TepoApplication in 5.755 seconds` | Flyway: schema v2 già applicato |
| `npm run dev` | Vite ready | 889 ms |
| `docker compose up -d --build` | 3 container Up | Build immagini ~27 s, immagini cached |
| `docker compose ps` | `db` healthy, `backend` e `frontend` Up | Porte 5432/8080/5173 |
| `docker compose logs backend` | `Started TepoApplication in 3.498 seconds` | Flyway: schema v2 già applicato |

### Backend — riconciliazione per suite

| Suite | Reale | Atteso (traceability) | Δ |
|---|---|---|---|
| `LlmAiAssistantTest` | 10 | 10 | ✅ |
| `ImportControllerTest` | 10 | 10 | ✅ |
| `ScenarioControllerTest` | 2 | 2 | ✅ |
| `SensitivityServiceTest` | 13 | 13 | ✅ |
| `DemoDatasetCoherenceTest` | 7 | 7 | ✅ |
| `BruteForceSolverTest` | 12 | 12 | ✅ |
| `DemoMultiObjectiveEmpiricalTest` | 2 | 2 | ✅ |
| `ExplanationReasonCodeTest` | 8 | 8 | ✅ |
| `ExplanationServiceTest` | 4 | 4 | ✅ |
| `MultiObjectiveDiscriminativeTest` | 3 | 3 | ✅ |
| `OrToolsSolverRegressionTest` | 10 | 10 | ✅ |
| `OrToolsSolverTest` | 6 | 6 | ✅ |
| `SolverEdgeCaseTest` | 8 | 8 | ✅ |
| `SolverParityTest` | 4 | 4 | ✅ |
| `SolverRandomizedParityTest` | 2 | 2 | ✅ |
| `GreedyBaselineComparisonTest` | 3 | 3 | ✅ |
| **Totale** | **104** | **104** | ✅ |

Nessuna discrepanza.

### Smoke test API

| Endpoint | Output | Atteso |
|---|---|---|
| `GET /api/buildings` | 10 | 10 |
| `GET /api/interventions` | 26 | 26 |
| `GET /api/scenarios/ping` | `status: ok` | ok |
| `GET /api/ai/status` | `llmConfigured: false`, `activeProvider: "rule-based"` | coerente con avvio senza chiave |

### Determinismo (3 POST identici)

Payload:
```
budgetCents = 50000000
objective = ENERGY_SAVING
candidateOptionIds = [OPT-001, OPT-003, OPT-005, OPT-008, OPT-009, OPT-013, OPT-017, OPT-019, OPT-021]
```

| Run | solverStatus | problemHash | totalInvestmentCents | objectiveValue | runId |
|---|---|---|---|---|---|
| 1 | OPTIMAL | `558a28a0…` | 50.000.000 | 301.500 | `464e3d2e-…` |
| 2 | OPTIMAL | `558a28a0…` | 50.000.000 | 301.500 | `50ced6b8-…` |
| 3 | OPTIMAL | `558a28a0…` | 50.000.000 | 301.500 | `ad83132b-…` |

`problemHash`, `totalInvestmentCents`, `objectiveValue` identici.
`runId` diverso per esecuzione (UUID). Determinismo confermato.

### Multi-obiettivo (set di candidati misto)

Payload (set misto: 5 opzioni elettriche, 4 a gas):
```
budgetCents = 50000000
candidateOptionIds = [OPT-001, OPT-003, OPT-005, OPT-009, OPT-013, OPT-007, OPT-014, OPT-016, OPT-024]
```

| Obiettivo | Selected | Energy | Economic | CO2 |
|---|---|---|---|---|
| `ENERGY_SAVING` | 001, 003, 005, 007, 009, 013, 016 | 277.500 | 5.677.500 | 36.150 |
| `ECONOMIC_SAVING` | 001, 003, 005, 007, 009, 013, 016 | 277.500 | 5.677.500 | 36.150 |
| `CO2_REDUCTION` | 001, 007, 013, 014, 016, 024 | 229.500 | 3.577.500 | **37.350** |

**ENERGY e CO2 divergono**: il portafoglio CO2 include `OPT-014` e `OPT-024`
(PdC a gas, 0.20 kg CO₂/kWh) ed esclude `OPT-003`, `OPT-005`, `OPT-009`
(LED, 0.10 kg CO₂/kWh). A parità di budget saturo, `CO2_REDUCTION` guadagna
+1.200 kg rispetto alla selezione ENERGY.

`ENERGY_SAVING` ed `ECONOMIC_SAVING` coincidono **su questo specifico
sottoinsieme**: i 5 LED hanno sia il miglior rapporto €/kWh sia il miglior
rapporto cent/kWh. La coincidenza è matematica, non un bug. Il test
`DemoMultiObjectiveEmpiricalTest.economicAndCo2DifferOnAtLeastOneBudget`
verifica la divergenza **su altri budget** dove i gas diventano competitivi.

### Verifica dataset corrente

Campionamento `GET /api/interventions`:

| ID | interventionTypeId | kWh | Economic (cent) | CO2 (kg) | econ/kWh | co2/kWh |
|---|---|---|---|---|---|---|
| OPT-001 | `TYPE-LED` (elettrico) | 37.500 | 937.500 | 3.750 | 25 | 0.10 |
| OPT-007 | `TYPE-INSULATION` (gas) | 60.000 | 600.000 | 12.000 | 10 | 0.20 |

I due vettori energetici sono distinti e coerenti con `DemoDataLoader`.

### Nota su DB volume e ri-esecuzione del loader

Durante la sessione è emerso che il volume Docker `tepo-db-data` conteneva
il dataset **pre-Fase E** (fattori uniformi `×20` / `×0.25`). Il loader
`DemoDataLoader` è idempotente (`if (buildingRepo.count() > 0) return;`):
al riavvio del backend non ha ri-eseguito il seed.

**Soluzione adottata**: `TRUNCATE intervention_options, intervention_types, buildings CASCADE`
sul DB di sviluppo, riavvio backend, re-seed automatico. Nessuna modifica al codice.

**Implicazione per verifiche future**: dopo qualsiasi modifica al dataset demo,
è necessario `TRUNCATE` del catalogo (o `docker compose down -v` se non serve
preservare lo storico di `optimization_runs`) per vedere i nuovi valori.

### Collaudo UI (5 punti critici)

| Punto | Esito |
|---|---|
| 4.1 Dashboard + catalogo (10/26, badge DEMO) | OK |
| 4.2 Scenario A: ENERGY_SAVING, 500k EUR | OK |
| 4.3 Scenario B: CO2_REDUCTION, 500k EUR, portafoglio diverso | OK |
| 4.4 Confronto A vs B: differenze visibili | OK |
| 4.5 Assistente AI: modalità locale, proposta, rifiuto | OK |

### Deployment Docker Compose end-to-end

Setup alternativo al percorso ibrido (db in Docker, backend e frontend locali).
Verifica che l'intero stack funzioni con le immagini containerizzate.

| Verifica | Esito |
|---|---|
| `docker compose up -d --build` | 3 container avviati |
| `tepo-db` | `Up (healthy)` |
| `tepo-backend` | `Up`, porte `0.0.0.0:8080->8080/tcp` |
| `tepo-frontend` | `Up`, porte `0.0.0.0:5173->80/tcp` |
| Log backend | `Started TepoApplication in 3.498 seconds` |
| Flyway | `Successfully validated 2 migrations`, schema v2 |
| `HikariPool` | connessione a `jdbc:postgresql://db:5432/tepo` |
| `GET /api/buildings` | 10 |
| `GET /api/interventions` | 26 |
| `GET /api/scenarios/ping` | `status: ok` |
| `GET http://localhost:5173` | HTTP 200 (nginx) |
| Browser `http://localhost:5173` | Dashboard carica 10/26; flusso scenario → risultato funzionante |

Il frontend containerizzato è servito da nginx, che fa da reverse proxy su
`/api/` verso il container backend. La comunicazione tra i tre servizi avviene
sulla rete Docker interna (`db:5432`, `backend:8080`).

Nota tecnica: i timestamp del backend containerizzato sono in UTC
(`08:24:49Z`), quelli del backend locale in CEST (`10:24:49+02:00`).
Differenza attesa: il container non ha `TZ` settata. Non impatta il
funzionamento.

**Confronto con il percorso ibrido** (backend/frontend locali):

| | Percorso ibrido | Docker Compose |
|---|---|---|
| Tempo di avvio backend | ~5.7 s | ~3.5 s |
| Tempo di avvio frontend | Vite dev server (~0.9 s) | nginx statico (istantaneo) |
| Hot-reload frontend | sì | no (build statico) |
| Immagini containerizzate verificate | no | **sì** |
| Rete db ↔ backend | localhost:5432 | rete Docker interna |

### Warning residui (invariati)

- React Router v7 future flags.
- Firefox: `MouseEvent.mozPressure` e `mozInputSource` deprecati.
- Jacoco: `Classes in bundle 'TEPO Backend' do not match with execution data`
  (cosmetico, build success).
- Maven: 3 `WARNING Could not transfer metadata` (repo remote, benigno).

### Limiti del collaudo

- Prova con provider LLM reale non eseguita.
- Import CSV con file esterni non rieseguito in questa sessione.
- Verifica tempi su 26 opzioni con timeout reali non misurata.

### Prossime priorità

- Prova con provider LLM reale (opzionale, richiede credenziali).
- Eventuale `dataRevision` su entità per tracciare la versione del dataset (NFR-09).
- Persistenza scenari A/B lato backend (superamento di P9).
- Rimozione `version:` da `docker-compose.yaml` (warning cosmetico).
- Baseline greedy vs solver: verificata (commit `3512621`, `GreedyBaselineComparisonTest`, 3 test).
