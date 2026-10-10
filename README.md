# TEPO — Trento Energy Portfolio Optimizer

Decision Support System per la selezione di portafogli di interventi di efficientamento energetico.

**Principio architetturale:** L'AI propone. L'utente confronta. Il Comune decide.

**Dataset:** DEMO — dati sintetici. Nessun dato reale del Comune di Trento è incluso.

---

## Cos'è TEPO

TEPO aiuta il Comune di Trento a rispondere a una domanda specifica:

> Dato un insieme di interventi energetici già individuati dai servizi tecnici,
> un budget limitato e una serie di vincoli, quale combinazione di interventi
> massimizza l'obiettivo scelto?

TEPO **non** progetta interventi, **non** stima costi o benefici, **non** prende
decisioni amministrative. Organizza candidati, valida scenari, applica vincoli,
ottimizza, confronta e spiega. La decisione finale resta umana.

---

## Cosa fa

- Gestisce edifici, tipologie e opzioni di intervento con provenienza dati esplicita.
- Crea scenari con budget, obiettivo (energia/economia/CO2) e vincoli.
- Ottimizza il portafoglio con **OR-Tools CP-SAT** (Knapsack/MILP binario).
- Spiega selezioni ed esclusioni con reason code deterministici.
- Confronta scenari (What-If).
- Visualizza gli edifici sulla mappa di Trento.

**Fuori dall'MVP:** IoT, digital twin, previsione dei consumi, monitoraggio
post-intervento, multi-anno, Pareto frontier. Elencati come Future Work in
`docs/requirements.md`.

---

## Stack

| Livello | Tecnologia |
|---|---|
| Backend | Java 21, Spring Boot 3.3.4, Spring Data JPA, Bean Validation |
| Database | PostgreSQL 16, Flyway per migrazioni |
| Ottimizzazione | Google OR-Tools CP-SAT 9.11 |
| Frontend | React 18, TypeScript, Vite, React Router, Leaflet + React Leaflet |
| Testing | JUnit 5 (backend), Vitest + Testing Library (frontend) |
| Documentazione API | springdoc-openapi (Swagger UI) |
| Infrastruttura | Docker Compose |

---

## Struttura repository
