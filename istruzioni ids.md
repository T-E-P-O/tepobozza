# TEPO — Istruzioni per l'avvio

## 1. Prerequisiti

Installa, se non li hai già:

| Software | Versione | Link |
|---|---|---|
| Docker Desktop | qualsiasi recente | https://www.docker.com/products/docker-desktop |
| JDK | 21 (Temurin raccomandato) | https://adoptium.net/temurin/releases/?version=21 |
| Maven | 3.9 o superiore | https://maven.apache.org/download.cgi |
| Node.js | 20 o superiore | https://nodejs.org/ |

Verifica l'installazione aprendo un terminale e lanciando:

```bash
docker --version
java --version
mvn --version
node --version
npm --version
```

Tutti devono rispondere con un numero di versione. Se uno fallisce, installalo prima di procedere.

---

## 2. Avvio su Windows (PowerShell)

Scompatta lo zip in una cartella (esempio: `C:\Users\tuonome\progetti\tepodeepseek`).

Apri **tre terminali PowerShell separati**.

### Terminale 1 — Database

```powershell
cd C:\Users\tuonome\progetti\tepodeepseek
docker compose up -d db
docker compose ps
```

Attendi che `tepo-db` mostri stato `running (healthy)`. Ci vogliono 10–15 secondi.

### Terminale 2 — Backend

```powershell
cd C:\Users\tuonome\progetti\tepodeepseek\backend

$env:JAVA_HOME   = "C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot"
$env:Path        = "$env:JAVA_HOME\bin;$env:Path"
$env:DB_URL      = "jdbc:postgresql://localhost:5432/tepo"
$env:DB_USERNAME = "tepo"
$env:DB_PASSWORD = "tepo"

mvn spring-boot:run "-Dspring-boot.run.profiles=demo"
```

**Importante:** sostituisci il percorso di `JAVA_HOME` con quello reale sul tuo computer. Cerca in:

- `C:\Program Files\Eclipse Adoptium\`
- `C:\Program Files\Java\`

Se vedi una cartella tipo `jdk-21.0.12.101-hotspot` o simile, usa quel percorso esatto.

Attendi la riga:

```
Started TepoApplication in X.XXX seconds
```

Lascia questo terminale aperto.

### Terminale 3 — Frontend

```powershell
cd C:\Users\tuonome\progetti\tepodeepseek\frontend
npm install
npm run dev
```

Attendi:

```
VITE v5.x.x  ready in XXX ms
➜  Local:   http://localhost:5173/
```

### Apri il browser

Vai su `http://localhost:5173`.

---

## 3. Avvio su Linux

Scompatta lo zip in una cartella (esempio: `/home/tuonome/progetti/tepodeepseek`).

Apri **tre terminali separati**.

### Terminale 1 — Database

```bash
cd /home/tuonome/progetti/tepodeepseek
docker compose up -d db
docker compose ps
```

Attendi `healthy`.

### Terminale 2 — Backend

```bash
cd /home/tuonome/progetti/tepodeepseek/backend

export JAVA_HOME=/usr/lib/jvm/temurin-21-jdk
export PATH="$JAVA_HOME/bin:$PATH"
export DB_URL=jdbc:postgresql://localhost:5432/tepo
export DB_USERNAME=tepo
export DB_PASSWORD=tepo

mvn spring-boot:run -Dspring-boot.run.profiles=demo
```

**Importante:** sostituisci `JAVA_HOME` con il percorso reale. Su Ubuntu/Debian con Temurin 21 installato via apt, di solito è `/usr/lib/jvm/temurin-21-jdk-amd64`. Se `java --version` mostra già `openjdk 21`, puoi saltare le due righe `export JAVA_HOME` e `export PATH`.

Attendi `Started TepoApplication`.

### Terminale 3 — Frontend

```bash
cd /home/tuonome/progetti/tepodeepseek/frontend
npm install
npm run dev
```

Apri `http://localhost:5173`.

---

## 4. Cosa trovi nel progetto

```
tepodeepseek/
├── backend/                Backend Spring Boot + solver OR-Tools
├── frontend/               Frontend React + Leaflet
├── docs/                   Documentazione tecnica
├── docker-compose.yml      Configurazione Docker
├── README.md               Panoramica del progetto
└── ISTRUZIONI-AVVIO.md     Questo file
```

### Documentazione chiave

| File | Contenuto |
|---|---|
| `README.md` | Panoramica generale, stack, avvio |
| `docs/requirements.md` | Requisiti funzionali e non funzionali |
| `docs/architecture.md` | Architettura a layer |
| `docs/domain-model.md` | Entità del dominio |
| `docs/optimization.md` | Modello matematico, tie-break, reason code |
| `docs/api.md` | Endpoint REST |
| `docs/testing.md` | Strategia di test |
| `docs/traceability.md` | Matrice requisiti → componente → test |
| `docs/collaudo.md` | Protocollo di collaudo eseguito |
| `docs/demo.md` | Script per la presentazione |
| `docs/audit-report.md` | Audit tecnico |
| `docs/uml/` | 4 diagrammi PlantUML |

---

## 5. Interfacce utili

| URL | Cosa |
|---|---|
| `http://localhost:5173` | Applicazione TEPO |
| `http://localhost:8080/swagger-ui.html` | Documentazione API interattiva |
| `http://localhost:8080/api/buildings` | Esempio risposta JSON |

---

## 6. Dataset demo

Il dataset è **sintetico** (10 edifici, 26 interventi). **Non sono dati reali del Comune di Trento.** Ogni valore è marcato `SYNTHETIC` in interfaccia, con badge "DEMO — dati sintetici" sempre visibile.

Il dataset viene caricato automaticamente la prima volta che avvii il backend con profilo `demo`. Ai riavvii successivi non viene duplicato.

### Ipotesi sintetiche dichiarate

- Tariffa energetica: 0.20 EUR/kWh
- Fattore di emissione: 0.25 kg CO2/kWh
- Payback: 8–25 anni

Vedi `docs/domain-model.md` per i dettagli.


