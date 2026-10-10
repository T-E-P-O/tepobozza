# Collaudo manuale TEPO

Data: 2026-10-09
Ambiente: Windows 11, JDK 21 Temurin 21.0.12.101, Maven 3.9,
Docker Desktop, PostgreSQL 16, Node 24, browser Chrome/Firefox.
Backend avviato con profilo `demo`, dataset 10 edifici / 26 interventi.

## Esito complessivo

Tutti i 15 passi del protocollo di collaudo sono stati superati.
Il flusso end-to-end funziona. Determinismo confermato su 3 run identici.
Console browser senza errori rossi (solo warning benigni di deprecazione
React Router e Firefox MouseEvent).

## Passi verificati

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

## Risultati osservati

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
Il vincolo di incompatibilità OPT-001 ↔ OPT-021 è applicato correttamente
(OPT-021 escluso quando OPT-001 selezionato).

## Warning residui (non bloccanti)

- React Router v7 future flags (deprecazione annunciata, funziona ancora).
- Firefox: `MouseEvent.mozPressure` e `MouseEvent.mozInputSource` deprecati.
- Docker Compose: campo `version` obsoleto nel YAML (da rimuovere).

## Problemi noti non bloccanti

- P4 (explanationsJson) — risolto in blocco A.
- P5 (parser CSV) — risolto con commons-csv.
- P6 (reason code) — risolto con distinzione esplicita.
- P7 (matrice) — risolta con colonna evidenza onesta.
- P9 (scenarioId fisso) — limite documentato, fuori MVP.
- P10 (doc AI) — riformulata.

## Prossime priorità

- Test frontend automatizzati (Vitest) per il punto 28 della specifica.
- Filtri interattivi su Edifici e Interventi (punto 51).
- Verifica responsive su tablet (punto 38).