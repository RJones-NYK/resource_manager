# Resource Manager

Team resource and project allocation tool for Arithmos. Plan FTE across projects, track availability, and review weekly timelines by resource or by project.

## Architecture

- **Next.js 15** (App Router) — web UI, runs on MacBook for dev
- **Postgres 16** — runs on Mac Mini via Docker
- **Drizzle ORM** — schema, migrations, queries
- **Tailscale** — MacBook connects to Mac Mini Postgres over dev database

```
MacBook                         Mac Mini (Tailscale)
────────                        ──────────────────
npm run dev                     Docker: Postgres 16
  └─ resource_manager_dev  ←──    ├─ resource_manager_dev
                                  └─ resource_manager_prod (later)
```

## Getting started

### 1. Postgres on Mac Mini

Follow the handover guide: **[docs/mac-mini-postgres-setup.md](docs/mac-mini-postgres-setup.md)**

### 2. App on MacBook

```bash
cp .env.example .env.local
# Edit DATABASE_URL with Mac Mini Tailscale hostname + password

npm install
npm run db:migrate    # apply schema to dev database
npm run dev           # http://localhost:3000
```

## Project structure

```
docker/                 Postgres on Mac Mini
  compose.yml
  init/                 Creates dev + prod databases
docs/
  mac-mini-postgres-setup.md
drizzle/                SQL migrations
src/
  app/                  Next.js pages
    views/by-resource/  Resource-centric timeline (MVP scaffold)
    views/by-project/   Project-centric timeline (MVP scaffold)
    resources/          Resource list
    projects/           Project list
  db/
    schema.ts           Drizzle schema
  components/
  lib/
```

## Database schema

| Table | Purpose |
|---|---|
| `roles` | Job roles (TMF Lead, Consultant, etc.) |
| `resources` | Team members — FTE hours/week, location, default FTE |
| `projects` | Client projects — budget hours, dates, status |
| `allocations` | Weekly FTE assignment (resource + project + week) |
| `out_of_office` | Unavailability date ranges per resource |

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run db:migrate` | Apply migrations |
| `npm run db:generate` | Generate migration from schema changes |
| `npm run db:studio` | Drizzle Studio (DB browser) |

## MVP roadmap

- [x] Postgres Docker setup (dev + prod)
- [x] Schema and initial migration
- [x] App scaffold with nav and placeholder views
- [ ] CRUD: roles, resources, projects
- [ ] Weekly FTE allocation entry
- [ ] By-resource timeline (live data)
- [ ] By-project timeline (live data)
- [ ] Out-of-office overlays
- [ ] Budget burn tracking
- [ ] Calendar view
- [ ] Deploy app to Mac Mini (prod)

## Environment variables

| Variable | Description |
|---|---|
| `APP_ENV` | `development` or `production` — controls DEV banner |
| `DATABASE_URL` | Postgres connection string |

See `.env.example` for format.
