# Demo TEPO — script riproducibile

Percorso dimostrativo breve, deterministico, eseguibile senza API key LLM.

---

## Preparazione

Da tre terminali separati:

```powershell
# Terminale 1 — database
cd C:\Users\mirco\progetti\tepobozza
docker compose up -d db
docker compose ps   # atteso: tepo-db healthy

# Terminale 2 — backend
cd C:\Users\mirco\progetti\tepobozza\backend
$env:JAVA_HOME   = "C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot"
$env:Path        = "$env:JAVA_HOME\bin;$env:Path"
$env:DB_URL      = "jdbc:postgresql://localhost:5432/tepo"
$env:DB_USERNAME = "tepo"
$env:DB_PASSWORD = "tepo"
mvn spring-boot:run "-Dspring-boot.run.profiles=demo"
# atteso: Started TepoApplication in X.XXX seconds

# Terminale 3 — frontend
cd C:\Users\mirco\progetti\tepobozza\frontend
npm run dev
# atteso: Local: http://localhost:5173/
```

Apri `http://localhost:5173`.

**Nota sul dataset**: se hai già avviato TEPO in passato, il DB può
contenere il dataset demo di una versione precedente (il volume Docker è
persistente tra sessioni). Per una demo con i valori aggiornati:

```powershell
docker exec -it tepo-db psql -U tepo -d tepo -c "TRUNCATE intervention_options, intervention_types, buildings CASCADE;"
# poi riavvia il backend (Ctrl+C, mvn spring-boot:run ...)
```

---

## Percorso in 11 passi

### 1. Dashboard

- Verifica i badge "DEMO — dati sintetici" e "DEMO" nel topbar.
- KPI catalogo: 10 edifici, 26 interventi.
- Nessun risultato pregresso (se sessionStorage è vuoto).

### 2. Edifici e interventi

- `/buildings`: tabella con 10 edifici, colonna "Provenienza" = `SYNTHETIC`.
- `/interventions`: tabella con 26 righe, stato "—".

### 3. Scenario Builder

- Vai su `/scenario`.
- **Candidati consigliati per la demo** (set misto: 5 elettrici, 4 a gas):
  `OPT-001, OPT-003, OPT-005, OPT-009, OPT-013, OPT-007, OPT-014, OPT-016, OPT-024`.
  Deseleziona gli altri.
- Budget: **500.000 EUR**.
- Obiettivo: **Risparmio energetico**.
- Salva come: **Scenario A**.
- Premi **Ottimizza portafoglio**.

### 4. Risultato A

- Si apre `/result` con stato solver `OPTIMAL`, `ottimalità provata`.
- **Valori attesi** (verificati il 2026-10-13, commit `9e786f4`):
  - Investimento: **500.000 EUR** (budget esaurito)
  - Budget residuo: **0 EUR**
  - Risparmio energetico: **277.500 kWh/anno**
  - Risparmio economico: **56.775 EUR/anno**
  - CO₂ evitata: **36.150 kg/anno**
  - Interventi selezionati: **7** (`OPT-001, OPT-003, OPT-005, OPT-007, OPT-009, OPT-013, OPT-016`)
- Sezione "Interventi selezionati": riga per riga con motivazione.
- Sezione "Perché questa soluzione?": elenco degli esclusi con reason code.

### 5. Vincolo di incompatibilità

`OPT-001` (LED scuola 1) è incompatibile con `OPT-021` (FV scuola 1) — il
backend applica l'incompatibilità hardcoded nello scenario `SCN-DEMO`.

- Aggiungi `OPT-021` al set di candidati.
- Ottimizza con lo stesso budget.
- Verifica che **solo uno dei due** venga selezionato.
- Nella lista esclusi, l'altro deve comparire con `ESCLUSO_INCOMPATIBILITA`
  o `ESCLUSO_NON_OTTIMALE`.

### 6. Vincolo di prerequisito

`OPT-014` (PdC scuola 7) richiede `OPT-013` (LED scuola 7).

- Seleziona `OPT-014` come candidato ma **deseleziona** `OPT-013`.
- Ottimizza.
- Verifica che `OPT-014` sia escluso con reason code `ESCLUSO_PREREQUISITO`.

### 7. Cambio obiettivo → Scenario B

- Torna su `/scenario` con il set di candidati del passo 3
  (5 elettrici + 4 a gas, senza `OPT-021`).
- Budget: **500.000 EUR**.
- Obiettivo: **Riduzione CO2**.
- Salva come: **Scenario B**.
- Ottimizza.

**Valori attesi** (verificati il 2026-10-13):
- Investimento: **500.000 EUR**
- Budget residuo: **0 EUR**
- Risparmio energetico: **229.500 kWh/anno** (inferiore ad A: il solver sta
  massimizzando CO₂, non energia)
- Risparmio economico: **35.775 EUR/anno**
- CO₂ evitata: **37.350 kg/anno** (**superiore** ad A: +1.200 kg)
- Interventi selezionati: **6** (`OPT-001, OPT-007, OPT-013, OPT-014, OPT-016, OPT-024`)

**Punto chiave della demo**: B include `OPT-014` e `OPT-024` (PdC a gas,
alto fattore CO₂) ed esclude `OPT-003`, `OPT-005`, `OPT-009` (LED elettrici,
basso fattore CO₂). A parità di budget, massimizzare la CO₂ evita richiede
di privilegiare opzioni diverse da quelle che massimizzano l'energia.

**Nota metodologica**: `ENERGY_SAVING` e `ECONOMIC_SAVING` possono coincidere
su alcuni sottoinsiemi (in questo caso specifico, i 5 LED hanno sia il
miglior €/kWh sia il miglior cent/kWh). La divergenza matematica è garantita
dal dataset, ma non sempre visibile su ogni set di candidati. La coppia
ENERGY vs CO2 diverge in modo netto e verificabile.

### 8. Confronto A vs B

- Vai su `/compare`.
- Tabella metriche + sezioni "Interventi aggiunti in B" / "Interventi rimossi in B".
- **Atteso**:
  - Aggiunti in B: `OPT-014`, `OPT-024`
  - Rimossi da A: `OPT-003`, `OPT-005`, `OPT-009`
- KPI delta (Δ investimento, Δ energia, Δ economia, Δ interventi).

### 9. Assistente AI (opzionale, senza LLM)

- Su `/scenario`, apri il pannello **Assistente AI**.
- Badge atteso: **Modalità locale** (nessuna chiave API configurata).
- Testo: `voglio ridurre la CO2 con budget 500k`.
- Premi **Chiedi all'assistente**.
- **Atteso**: proposta con badge **Regole locali**, `budgetCents: 50000000`,
  `objective: CO2_REDUCTION`, 26 candidati, `requiresHumanReview: true`.
- Premi **Rifiuta**. Verifica che il form sia invariato.

### 10. Applicazione esplicita della proposta AI

- Ripeti la richiesta, premi **Applica allo scenario**.
- Verifica il banner "Proposta AI applicata. Verifica e premi Ottimizza".
- Verifica che i campi budget/obiettivo siano stati riempiti.
- Premi **Ottimizza portafoglio**: la decisione di eseguire il solver resta umana.

### 11. Analisi di sensibilità

- Vai su `/sensitivity`.
- Budget base: **500.000 EUR**.
- Obiettivo: **Risparmio energetico**.
- Punti: **11**. Fattori: **0.5 – 1.5**.
- Premi **Esegui analisi**.

Verifica:
- KPI sintesi: punti, intervallo budget, conteggio stabili/oscillanti/mai selezionati.
- Tabella risultati: una riga per budget con stato, investimento, residuo,
  valore obiettivo, barra interventi.
- Sezione "Stabilità delle selezioni": tre elenchi.
- Nota metodologica in cima: "sweep deterministico, non Monte Carlo".

**Non è Monte Carlo**: la griglia è deterministica, non casuale.
**Non è una previsione**: esplora il comportamento del solver su una gamma
di budget noti, con gli stessi candidati.

---

## Riassunto valori attesi

### Scenario A (500.000 EUR, ENERGY_SAVING)

| Metrica | Valore |
|---|---|
| Investimento | 500.000 EUR |
| Budget residuo | 0 EUR |
| Risparmio energetico | 277.500 kWh/anno |
| Risparmio economico | 56.775 EUR/anno |
| CO₂ evitata | 36.150 kg/anno |
| Interventi | 7 |
| Selected | OPT-001, OPT-003, OPT-005, OPT-007, OPT-009, OPT-013, OPT-016 |

### Scenario B (500.000 EUR, CO2_REDUCTION)

| Metrica | Valore |
|---|---|
| Investimento | 500.000 EUR |
| Budget residuo | 0 EUR |
| Risparmio energetico | 229.500 kWh/anno |
| Risparmio economico | 35.775 EUR/anno |
| CO₂ evitata | 37.350 kg/anno |
| Interventi | 6 |
| Selected | OPT-001, OPT-007, OPT-013, OPT-014, OPT-016, OPT-024 |

### Confronto A vs B

| | A | B |
|---|---|---|
| Interventi | 7 | 6 |
| Investimento | 500.000 EUR | 500.000 EUR |
| Risparmio energetico | 277.500 kWh | 229.500 kWh |
| CO₂ evitata | 36.150 kg | **37.350 kg** |
| Aggiunti in B | — | OPT-014, OPT-024 |
| Rimossi da A | OPT-003, OPT-005, OPT-009 | — |

**Interpretazione**: B rinuncia a 48.000 kWh di risparmio energetico per
guadagnare 1.200 kg di CO₂ evitata, a parità di budget. È il trade-off
energia/CO₂ materializzato dalla struttura a due vettori energetici.

---

## Determinismo

Il solver è configurato con `num_search_workers = 1`, `random_seed = 0`,
tie-break lessicografico a 4 passi, `problem_hash` canonico (SHA-256 su
contenuto ordinato). Ripetere la stessa ottimizzazione produce gli stessi:
- `selectedOptionsId`,
- `totalInvestmentCents`,
- `objectiveValue`,
- `problemHash`.

Il `runId` cambia a ogni esecuzione (UUID).

Verifica rapida (3 POST identici):

```powershell
$body = @{
  budgetCents = 50000000
  objective = "ENERGY_SAVING"
  candidateOptionIds = @("OPT-001","OPT-003","OPT-005","OPT-008","OPT-009","OPT-013","OPT-017","OPT-019","OPT-021")
  incompatibilities = @()
  prerequisites = @()
  maxNumber = $null
  maxNumberOptionIds = @()
} | ConvertTo-Json -Depth 5

1..3 | ForEach-Object {
  Invoke-RestMethod -Uri "http://localhost:8080/api/scenarios/SCN-DEMO/optimize" `
    -Method Post -Body $body -ContentType "application/json"
} | Select-Object solverStatus, problemHash, totalInvestmentCents, objectiveValue, runId
```

Atteso (verificato il 2026-10-13, commit `9e786f4`):
`problemHash = 558a28a0ee42ca86bd1e9e2aba5bd7f34b376f8202399a4307ec9d9d75531899`
identico nei 3 run.

---

## Backup (se la demo live fallisce)

1. `docs/screenshot/` — schermate di riferimento.
2. `docs/collaudo.md` — sessione 3 (2026-10-13) con tutti gli output.
3. Backend funziona **senza** API key LLM: se il provider non è configurato,
   l'assistente ricade su regole locali senza errori.

---

## Cosa NON promettere in aula

- Non dire "TEPO ottimizza costi, energia e CO₂ insieme": il modello è
  **mono-obiettivo**, si sceglie un criterio per volta.
- Non dire "l'AI decide": l'assistente propone, il solver calcola, l'utente
  applica.
- Non presentare i payback come misure ufficiali: sono ipotesi demo
  (`SYNTHETIC`).
- Non chiamare "Monte Carlo" l'analisi di sensibilità: è uno sweep
  deterministico.
- Non promettere l'integrazione con dati reali del Comune.
- Non dire che gli obiettivi producono **sempre** portafogli diversi: su
  alcuni set di candidati ENERGY ed ECONOMIC possono coincidere (è il caso
  di un sottoinsieme tutto-elettrico). La divergenza è garantita dal dataset
  quando c'è un trade-off elettricità/gas nel set.
