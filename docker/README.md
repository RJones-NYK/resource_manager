# Docker — Mac Mini

Postgres only. See `docs/mac-mini-postgres-setup.md` for full handover instructions.

```bash
# From repo root on Mac Mini
cd docker
cp .env.example .env
# Edit .env with real passwords
docker compose up -d
```
