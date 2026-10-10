# Requisiti TEPO

## Requisiti funzionali

| ID | Requisito | Criterio di accettazione |
|---|---|---|
| FR-01 | Gestire edifici | CRUD su `Building`; ID duplicato rifiutato. |
| FR-02 | Gestire tipologie | `InterventionType` classificano le opzioni senza condividerne i costi. |
| FR-03 | Gestire opzioni | Ogni `InterventionOption` ha edificio, tipo, costo, benefici, provenienza. |
| FR-04 | Gestire vincoli | Budget, incompatibilità, prerequisiti, max K, inclusioni/esclusioni applicati. |
| FR-05 | Creare scenari | Scenario salvato preserva candidati, budget, obiettivo, vincoli. |
| FR-06 | Definire budget | Budget configurabile per scenario; nessun valore comunale predefinito. |
| FR-07 | Scegliere obiettivo | ENERGY_SAVING, ECONOMIC_SAVING, CO2_REDUCTION. |
| FR-08 | Ottimizzare | Risultato ammissibile, stato solver e ottimalità esposti. |
| FR-09 | Mostrare piano | Selezione collegata alle opzioni; nessuna ambiguità con delibera. |
| FR-10 | Mostrare metriche | Totali riconciliabili; residuo = budget − investimento. |
| FR-11 | Spiegare | Ogni opzione ha esito e motivazione corretta. |
| FR-12 | What-If | Copia scenario non altera l'originale. |
| FR-13 | Confrontare | Due run mostrano delta selezione, costo, benefici. |
| FR-14 | Distinguere dati | Provenienza REAL/SYNTHETIC/MIXED visibile. |
| FR-15 | Import minimo | File strutturato validato prima del commit. |
| FR-16 | Audit calcolo | Snapshot, versioni, solver, spareggio conservati. |
| FR-17 | Gestire esiti | INFEASIBLE, timeout, input incompleto distinti. |
| FR-18 | Orchestrazione AI opzionale | L'LLM propone parametri validati; FR-01..17 funzionano senza. |

## Requisiti non funzionali

| ID | Requisito | Verifica |
|---|---|---|
| NFR-01 | Usabilità | Utente non tecnico crea e confronta due scenari. |
| NFR-02 | Isolamento | Test solver senza frontend/DB. |
| NFR-03 | Riproducibilità | Run identici producono selezioni identiche. |
| NFR-04 | Interpretabilità | Ogni spiegazione cita vincoli/valori reali. |
| NFR-05 | Sostituibilità | Adapter solver intercambiabili. |
| NFR-06 | Tracciabilità | FR → UC → componente → test. |
| NFR-07 | Trasparenza | Natura sintetica visibile in UI. |
| NFR-08 | Prestazioni | Run canonico 20–30 opzioni < 5 secondi. |
| NFR-09 | Integrità | Snapshot coerente; risultati immutabili. |
| NFR-10 | Protezione | Nessun segreto nel repo. |