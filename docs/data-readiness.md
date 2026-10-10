# TEPO — Data readiness

Stato al 2026-10-10.

## Scopo

Questo documento mappa le fonti di dati rilevanti per TEPO, distinguendo:

- **[CONFIRMED]** — disponibilità confermata direttamente dal Comune.
- **[PROBABLE]** — indicata come probabile, ma non confermata.
- **[TO VERIFY]** — non confermata, richiede chiarimento.
- **[ASSUMPTION]** — ipotesi del gruppo per il prototipo.
- **[SYNTHETIC]** — generata dal gruppo, non proveniente dal Comune.

Per ogni fonte sono indicati: titolare, formato, granularità, periodo, unità, autorizzazioni, uso in TEPO.

**Nessun dato reale del Comune è presente nel repository.** Il prototipo usa esclusivamente il dataset sintetico in `DemoDataLoader` (10 edifici, 26 interventi).

---

## 1. Fonti esterne a TEPO

| Fonte | Stato | Titolare | Formato | Granularità | Periodo | Unità | Autorizzazioni | Uso TEPO |
|---|---|---|---|---|---|---|---|---|
| Elenco edifici comunali | [PROBABLE] | Comune di Trento | [TO VERIFY] | per edificio | attuale | — | [TO VERIFY] | Catalogo `Building` |
| Anagrafica tecnica edifici (superficie, tipo, anno) | [TO VERIFY] | Comune di Trento | [TO VERIFY] | per edificio | attuale | m², categoria | [TO VERIFY] | Arricchimento `Building` |
| Consumi energetici per edificio | [PROBABLE] | Comune di Trento | [TO VERIFY] | per edificio / mese o anno | [TO VERIFY] | kWh, kWh/m² | [TO VERIFY] | Baseline per stime |
| Bollette energetiche | [PROBABLE] | Comune di Trento | PDF / CSV | per edificio / periodo | [TO VERIFY] | EUR, kWh | [TO VERIFY] | Costi storici |
| Caratteristiche impianti (caldaie, PdC, FV) | [TO VERIFY] | Comune di Trento | [TO VERIFY] | per impianto | attuale | kW, anno | [TO VERIFY] | Ammissibilità interventi |
| Mappe e dati GIS | [CONFIRMED, portata limitata] | Comune di Trento | [TO VERIFY] | per edificio | attuale | lat/lng | [TO VERIFY] | Posizionamento mappa |
| Interventi già pianificati dai servizi tecnici | [PROBABLE] | Servizi tecnici comunali | [TO VERIFY] | per intervento | [TO VERIFY] | EUR, kWh, kg CO2 | [TO VERIFY] | Candidati `InterventionOption` |
| Costi consuntivi di interventi passati | [TO VERIFY] | Comune di Trento | [TO VERIFY] | per intervento | storico | EUR | [TO VERIFY] | Validazione stime |
| Prezzari regionali / provinciali | [ASSUMPTION] | Provincia autonoma di Trento | PDF / web | per voce | annuale | EUR | pubblico | Riferimento costi |
| Obiettivi PAESC | [TO VERIFY] | Comune di Trento | [TO VERIFY] | per settore | [TO VERIFY] | t CO2 | [TO VERIFY] | Allineamento obiettivo |

---

## 2. Nota sul punto di contatto con il Comune

Nella comunicazione di Alex Tomasi (Comune di Trento), riportata nei documenti di progetto:

- Pre-Fix **non** è stato adottato dall'Amministrazione. **[CONFIRMED]**
- Gli interventi di maggiore dimensione sono pianificati dai servizi competenti in sede di bilancio e pianificazione. **[CONFIRMED]**
- Le risorse dipendono dalla pianificazione e da quanto mette a disposizione l'Amministrazione. **[CONFIRMED]**
- Mappe e necessità di consultare i colleghi sui dati. **[CONFIRMED, portata limitata]**
- Consumi per edificio e bollette **probabili**. **[PROBABLE]**

Non è stato consegnato alcun dataset utilizzabile. Non è confermato formato, granularità, frequenza, copertura storica, identificativi, esportazione, accessi e disponibilità per gli studenti.

Non è confermata l'esistenza o l'assenza di altri sistemi di portfolio optimization energetica nel contesto comunale (Smart Control Room è un possibile contesto di integrazione, non confermato).

---

## 3. Dataset sintetico attualmente in uso

**File:** `backend/src/main/java/it/unitn/tepo/configuration/DemoDataLoader.java`
**Profilo:** `demo`
**Contenuto:**
- 10 edifici (`BLD-001` … `BLD-010`)
- 6 tipologie di intervento (`TYPE-LED`, `TYPE-WINDOWS`, `TYPE-INSULATION`, `TYPE-HEATPUMP`, `TYPE-PV`, `TYPE-BOILER`)
- 26 opzioni di intervento (`OPT-001` … `OPT-026`)

**Ipotesi sintetiche dichiarate:**

- Tariffa energetica: **0.20 EUR/kWh** (20 cent/kWh).
- Fattore di emissione: **0.25 kg CO2/kWh**.
- Scala: 1:1 per energia (kWh), CO2 (kg), importi (cent).
- Payback: 8–25 anni.

**Provenienza in dominio:** `DataProvenance.SYNTHETIC` su ogni entità.

**Etichettatura in UI:** badge "DEMO — dati sintetici" in ogni pagina.

Questi dati sono **didattici**. Non rappresentano preventivi, consumi o risparmi reali.

---

## 4. Cosa manca per usare dati reali

Per sostituire il dataset sintetico con dati reali, servono almeno:

1. **Conferma della disponibilità** di un sottoinsieme limitato (3–5 edifici).
2. **Accordo formale** sull'uso dei dati (accesso, conservazione, pubblicazione).
3. **Specifica del formato** (CSV, JSON, Excel, estrazione da DB).
4. **Granularità minima**: per edificio, per anno, con unità dichiarate.
5. **Identificativi stabili** collegabili al catalogo TEPO.
6. **Referente tecnico** per la validazione delle stime.
7. **Processo di import** concordato (chi carica, chi valida, chi pubblica).

Senza questi punti, TEPO resta utilizzabile solo su dataset sintetici.

---

## 5. Progettazione concettuale per dati reali (non implementata)

Se il Comune fornirà dati, il modello potrebbe essere esteso con entità aggiuntive, **senza modificare** quelle attuali:

### 5.1 `EnergyObservation`

```
id, buildingId, periodStart, periodEnd,
energyKwh, energyVector, costEur, source,
dataSourceId, provenance, version, notes
```

Traccia osservazioni storiche di consumo e costo.

### 5.2 `BuildingCharacteristic`

```
id, buildingId, key, value, unit, source,
dataSourceId, date, provenance
```

Traccia caratteristiche tecniche (superficie, anno, tipo impianto, ecc.) in forma flessibile.

### 5.3 `DataSource`

```
id, name, owner, url, license, lastConsulted,
contactReference, notes
```

Traccia la provenienza di ogni valore (già embrionalmente presente come campo `source` su `InterventionOption`).

### 5.4 `InterventionEstimate`

```
id, optionId, source, date, assumptions,
uncertaintyLow, uncertaintyHigh, unit, notes
```

Traccia stime di costo/beneficio con intervallo di incertezza esplicito.

### 5.5 `VerificationState`

Enum sui valori numerici:

- `OBSERVED` — misurato o documentato.
- `DERIVED` — calcolato da altre fonti con metodo dichiarato.
- `ESTIMATED` — stima con assunzioni.
- `HYPOTHETICAL` — ipotesi didattica.
- `MISSING` — non disponibile.

Distinzione fondamentale per NFR-07 e per la trasparenza verso il Comune.

**Nessuna di queste entità è implementata.** Sono proposte da valutare solo dopo che il Comune fornirà dati.

---

## 6. Processo di import dati reali (design)

Se e quando dati autorizzati saranno disponibili, il flusso è:

1. **Isolamento**: profilo Spring dedicato `real-data`, separato da `demo`.
2. **Preview obbligatoria**: `POST /api/imports/.../validate` senza scrittura.
3. **Commit esplicito**: `POST /api/imports/.../commit` con conferma umana.
4. **Tracciamento versione**: campo `dataRevision` sui record importati.
5. **Referente**: nome e data del validatore registrati.
6. **Rollback**: la revisione precedente resta consultabile, non sovrascritta.

Il dataset demo **non viene toccato**. I due dataset coesistono e si distinguono per `provenance`.

---

## 7. Cosa rimane non confermato

- Esistenza di un elenco di interventi non ancora finanziati.
- Presenza di stime di costo e beneficio comparabili tra interventi.
- Processo effettivo di selezione dei portafogli energetici comunali.
- Ruolo dell'Amministrazione nel flusso decisionale.
- Formati e autorizzazioni per accesso ai dati.
- Coerenza con altri strumenti (Smart Control Room, PAESC).
- Disponibilità di ospitare TEPO su infrastruttura comunale.

Queste domande sono elencate in `docs/requirements.md` (sezione "Domande aperte") e vanno poste al referente comunale prima di qualunque integrazione.

---

## 8. Nessun accesso non autorizzato

- Nessun accesso a sistemi comunali.
- Nessuna API comunale invocata.
- Nessuna credenziale presente nel repository.
- Nessun dato personale.
- Nessuno scraping automatico attivo.

Se in futuro sarà necessario accedere a dati autorizzati, l'accesso dovrà essere esplicito, tracciato e concordato con il Comune.