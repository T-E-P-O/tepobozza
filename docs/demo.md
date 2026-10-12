# Demo TEPO — script riproducibile

Percorso dimostrativo breve, deterministico, eseguibile senza API key LLM.
Ogni valore numerico della sezione "Risultati attesi" va verificato in aula;
le tabelle riportano il formato di compilazione, non valori inventati.

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

---

## Percorso in 11 passi

### 1. Dashboard

- Verifica i badge "DEMO — dati sintetici" e "DEMO" nel topbar.
- Verifica KPI catalogo: 10 edifici, 26 interventi.
- Nessun risultato pregresso (se sessionStorage è vuoto).

### 2. Edifici e interventi

- `/buildings`: tabella con 10 edifici, colonna "Provenienza" = `SYNTHETIC`.
- `/interventions`: tabella con 26 righe, stato "—" (nessun risultato).

### 3. Scenario Builder

- Vai su `/scenario`.
- Verifica la colonna "Interventi considerati": 26 righe, tutte selezionate.
- Imposta budget **500.000 EUR**.
- Obiettivo: **Risparmio energetico**.
- Salva come: **Scenario A**.
- Premi **Ottimizza portafoglio**.

### 4. Risultato A

- Si apre `/result`.
- Verifica stato solver: `OPTIMAL`, `ottimalità provata`.
- Annota: investimento totale, risparmio energetico, economico, CO₂, numero interventi.
- Sezione "Interventi selezionati": riga per riga, con motivazione.
- Sezione "Perché questa soluzione?": elenco degli esclusi con reason code.

### 5. Vincolo di incompatibilità

Torna su `/scenario`, verifica che tra i candidati ci siano `OPT-001` (LED scuola 1) e `OPT-021` (FV scuola 1). Il backend applica già l'incompatibilità hardcoded nello scenario `SCN-DEMO`.

- Seleziona entrambi come candidati.
- Ottimizza con lo stesso budget.
- Verifica che **solo uno dei due** venga selezionato (dipende dal rapporto energia/costo).
- Nella lista esclusi deve comparire l'altro con reason code `ESCLUSO_INCOMPATIBILITA` (o `ESCLUSO_NON_OTTIMALE` se non è localmente bloccato).

### 6. Vincolo di prerequisito

`OPT-014` (PdC scuola 7) richiede `OPT-013` (LED scuola 7).
- Seleziona `OPT-014` come candidato ma **deseleziona** `OPT-013`.
- Ottimizza.
- Verifica che `OPT-014` sia escluso con reason code `ESCLUSO_PREREQUISITO`.

### 7. Cambio obiettivo

Torna su `/scenario` con gli stessi candidati:
- Budget: 500.000 EUR.
- Obiettivo: **Riduzione CO2**.
- Salva come: **Scenario B**.
- Ottimizza.

Confronta il portafoglio B con A: con i dati demo aggiornati ai due vettori energetici (elettricità / gas), **almeno una coppia di obiettivi produce portafogli diversi** (verificato da `DemoMultiObjectiveEmpiricalTest`).

### 8. Confronto A vs B

Vai su `/compare`.
- Tabella metriche: budget, investimento, risparmio energia, risparmio economico, CO₂, interventi, stato solver.
- Sezioni "Interventi aggiunti in B" / "Interventi rimossi in B".
- KPI delta (Δ investimento, Δ energia, Δ economia, Δ interventi).

### 9. Assistente AI (opzionale)

Su `/scenario`, apri il pannello **Assistente AI**.
- Badge atteso: **Modalità locale** (nessuna chiave API configurata).
- Testo: `voglio ridurre la CO2 con budget 500k`.
- Premi **Chiedi all'assistente**.
- La proposta appare con badge **Regole locali**, budget, obiettivo, numero candidati, eventuali warning.
- **Non applicare**: premi **Rifiuta**. Verifica che il form sia invariato.

### 10. Applicazione esplicita

Ripeti la richiesta, questa volta premi **Applica allo scenario**.
- Verifica il banner "Proposta AI applicata. Verifica e premi Ottimizza".
- Verifica che i campi budget/obiettivo siano stati riempiti.
- Premi **Ottimizza portafoglio**: la decisione di eseguire il solver resta umana.

### 11. Analisi di sensibilità

Vai su `/sensitivity`.
- Budget base: 500.000 EUR.
- Obiettivo: **Risparmio energetico**.
- Punti: **11**.
- Fattori: 0.5 – 1.5.
- Premi **Esegui analisi**.

Verifica:
- KPI sintesi: punti, intervallo budget, conteggio stabili/oscillanti/mai selezionati.
- Tabella risultati: una riga per budget, con stato solver, investimento, residuo, valore obiettivo, barra interventi.
- Sezione "Stabilità delle selezioni": tre elenchi.
- Nota metodologica in cima: "sweep deterministico, non Monte Carlo".

---

## Risultati attesi (da compilare dopo esecuzione)

Compila le celle dopo aver eseguito il percorso. **Non inserire numeri stimati**: solo quelli restituiti dal backend.

### Scenario A (500.000 EUR, ENERGY_SAVING)

| Metrica | Valore |
|---|---|
| Investimento totale | … |
| Budget residuo | … |
| Risparmio energetico (kWh/anno) | … |
| Risparmio economico (EUR/anno) | … |
| CO₂ evitata (kg/anno) | … |
| Interventi selezionati | … |
| Stato solver | OPTIMAL |

### Scenario B (500.000 EUR, CO2_REDUCTION)

| Metrica | Valore |
|---|---|
| Investimento totale | … |
| Budget residuo | … |
| Risparmio energetico (kWh/anno) | … |
| Risparmio economico (EUR/anno) | … |
| CO₂ evitata (kg/anno) | … |
| Interventi selezionati | … |
| Stato solver | OPTIMAL |

**Confronto A vs B** (verificare che differisca almeno in un intervento selezionato):

| | A | B |
|---|---|---|
| Interventi | … | … |
| Investimento | … | … |
| Risparmio energetico | … | … |
| CO₂ evitata | … | … |

---

## Determinismo

Il solver è configurato con `num_search_workers = 1`, `random_seed = 0`,
tie-break lessicografico a 4 passi, `problem_hash` canonico.
Ripetere la stessa ottimizzazione deve produrre gli stessi:
- `selectedOptionsId`,
- `totalInvestmentCents`,
- `objectiveValue`,
- `problemHash`.

Il `runId` cambia a ogni esecuzione (UUID).

---

## Verifica determinismo (opzionale, 1 minuto)

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
} | Select-Object solverStatus, problemHash, totalInvestmentCents, objectiveValue
```

Atteso: `problemHash` identico nei 3 output, `totalInvestmentCents` identico,
`objectiveValue` identico.

---

## Backup (se la demo live fallisce)

1. `docs/screenshot/` — schermate di riferimento.
2. `docs/collaudo.md` — sessioni di verifica precedenti con risultati numerici.
3. Backend funziona **senza** API key LLM: se il provider non è configurato,
   l'assistente ricade su regole locali senza errori.

---

## Cosa NON promettere in aula

- Non dire "TEPO ottimizza costi, energia e CO₂ insieme": il modello è **mono-obiettivo**, si sceglie un criterio per volta.
- Non dire "l'AI decide": l'assistente propone, il solver calcola, l'utente applica.
- Non presentare i payback come misure ufficiali: sono ipotesi demo (`SYNTHETIC`).
- Non chiamare "Monte Carlo" l'analisi di sensibilità: è uno sweep deterministico.
- Non promettere l'integrazione con dati reali del Comune: non è nel perimetro.
