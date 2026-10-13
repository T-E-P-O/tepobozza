# TEPO — Checkpoint di progetto

**Data:** 2026-10-13  
**Repository:** `mirconegri/tepobozza`  
**Branch:** `main`  
**Commit di riferimento:** `8340157` — `test(optimization): baseline greedy vs solver ottimo`  
**Stato dichiarato:** commit presente su `origin/main`, working tree pulito.

> Questo checkpoint riassume lo stato riportato al termine della sessione del 13 ottobre 2026. I risultati sono una registrazione delle verifiche effettuate nella sessione, non una nuova esecuzione indipendente.

## Stato generale

Il prototipo TEPO è in uno stato utilizzabile per la demo accademica. La baseline automatizzata, il determinismo dell'ottimizzazione, il percorso UI principale e il deployment Docker Compose completo sono stati riportati come superati. Il dataset è dimostrativo: non presentare i risultati numerici come misure o decisioni reali del Comune di Trento.

## Baseline automatizzata

| Componente | Risultato riportato |
|---|---:|
| Backend | 104/104 test verdi |
| Frontend | 19/19 test verdi |
| Repository | Working tree pulito; commit pushato su `origin/main` |

La suite backend include, tra gli altri, test di parità randomizzata solver/oracolo esaustivo, discriminazione multi-obiettivo, reason code delle spiegazioni, sensibilità al budget, import CSV e confronto fra solver e baseline greedy.

## Collaudo dello stack e del flusso principale

Sono stati riportati i seguenti esiti:

- Database Docker in stato `healthy`, backend avviato e frontend Vite pronto nel setup ibrido.
- Migrazioni Flyway validate, schema alla versione 2.
- Endpoint di smoke test: 10 edifici, 26 interventi, ping scenario `ok` e stato AI coerente con il provider `rule-based`.
- Deployment Docker Compose completo: tre container avviati (`db`, `backend`, frontend `nginx`) ed endpoint verificati tramite la rete Docker interna.
- Percorso UI principale verificato: dashboard/catalogo, Scenario A con `ENERGY_SAVING`, Scenario B con `CO2_REDUCTION`, confronto fra risultati e assistente AI in modalità locale con proposta e rifiuto.

La prova con un provider LLM reale non è stata eseguita.

## Determinismo e obiettivi

Tre richieste identiche a `POST /api/scenarios/SCN-DEMO/optimize` hanno restituito:

- `solverStatus`: `OPTIMAL` per tutte le esecuzioni;
- `problemHash`: identico (`558a28a0…`);
- `totalInvestmentCents`: identico (`50.000.000`);
- `objectiveValue`: identico (`301.500`);
- `runId`: diverso per ogni esecuzione, come atteso per un identificativo di run.

Nel test con un set misto di cinque opzioni elettriche e quattro a gas, con budget di 500.000 euro, `CO2_REDUCTION` ha prodotto un portafoglio diverso da `ENERGY_SAVING`. `ENERGY_SAVING` ed `ECONOMIC_SAVING` hanno coinciso su quel sottoinsieme specifico; la divergenza fra obiettivi è verificata anche da test su ulteriori budget. Non dedurre che ogni coppia di obiettivi debba produrre sempre portafogli diversi su qualsiasi insieme di candidati.

## Confronto solver–greedy

`GreedyBaselineComparisonTest` riporta tre test verdi:

1. il solver non è peggiore del greedy nelle 150 istanze randomizzate considerate (50 seed per tre obiettivi);
2. almeno un'istanza randomizzata in cui il solver supera il greedy;
3. un controesempio classico di knapsack in cui l'ottimo vale 16 e il greedy 10.

Questi risultati mostrano un vantaggio misurabile in almeno alcuni casi e la correttezza empirica sui campioni testati. Non quantificano ancora il gap medio o la distribuzione dei vantaggi su istanze specifiche del dominio TEPO.

## Documentazione

Risultano aggiornati, secondo il resoconto della sessione:

- `docs/collaudo.md` — sessione di collaudo del 13 ottobre;
- `docs/demo.md` — script demo in 11 passaggi con risultati osservati;
- `docs/traceability.md` — requisiti e tracciabilità;
- `docs/testing.md` — strategia e limiti dei test;
- `docs/audit-report.md` — risultati della Fase E, bug e criticità aperte;
- `docs/optimization.md` — formulazione, spiegazioni, hash e sensibilità;
- `docs/api.md` e `README.md` — API, stack e baseline aggiornati.

## Limiti e attività non completate

- Prova end-to-end con un provider LLM reale: non eseguita, richiede credenziali.
- Import CSV su file esterni reali: non rieseguito nella sessione.
- Misurazione dei tempi su 26 opzioni con timeout effettivi: non eseguita.
- Validazione con `@Valid`/DTO dedicati per `BuildingController` e `InterventionController`: gap residuo segnalato, da valutare prima di esporre API di scrittura oltre il contesto demo.
- Il gap medio solver–greedy su istanze rappresentative TEPO non è stato misurato.

I dati e i risultati dimostrativi non devono essere descritti come dati energetici certificati o come portfolio di interventi approvato dal Comune. Ogni evoluzione basata su dati reali richiede la disponibilità, la provenienza e la validazione del dataset pertinente.

## Indicazione per la prossima sessione

1. Non modificare solver o dipendenze senza un finding riproducibile o una misura che giustifichi l'intervento.
2. Se la consegna imminente è accademica, congelare la baseline corrente e preparare slide, relazione e script di demo usando esclusivamente numeri già osservati e dichiarando le assunzioni del dataset.
3. Trattare LLM reale, import su file esterni e benchmark temporali come attività opzionali o successive, salvo requisiti espliciti della consegna.
4. Prima di qualsiasi ulteriore fix, riconciliare il problema con gli ID e lo stato presenti in `docs/audit-report.md`.
