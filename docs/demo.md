# Demo TEPO (script 10 passi)

## Preparazione

```bash
docker compose up -d db
cd backend && mvn spring-boot:run "-Dspring-boot.run.profiles=demo"
cd frontend && npm run dev