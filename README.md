# Resource Manager

Team resource and project allocation tool for Arithmos. Plan weekly FTE across projects, track capacity on the dashboard, and review timelines by resource or by project.

## Architecture

- **Next.js 15** (App Router) — web UI (dev on MacBook; production on Mac Mini when deployed)
- **Postgres 16** — Docker on Mac Mini
- **Drizzle ORM** — schema, migrations, queries
- **Tailscale** — private network between machines; no application-level login

```
MacBook (dev)                   Mac Mini (Tailscale)
────────────                    ────────────────────
npm run dev                     Docker: Postgres 16
  └─ resource_manager_dev  ←──    ├─ resource_manager_dev
                                  └─ resource_manager_prod
```

## Access and security

This app has **no built-in authentication** (no users, sessions, or API keys). Access is controlled by **network placement only**:

1. **Postgres** listens on the Mac Mini and is reachable only over **Tailscale** (not exposed to the public internet). Use a strong `POSTGRES_PASSWORD` in `docker/.env`.
2. **The web UI** is intended to run on the same private tailnet (e.g. `npm run dev` on a MacBook, or `npm run start` on the Mac Mini bound to the Tailscale interface). Anyone who can open the URL can read and change all data.
3. **Tailscale ACLs** (optional) can restrict which devices or users may reach the Mac Mini hostname and ports.

Do not publish the app to a public URL without adding an auth layer. For Arithmos internal use, Tailscale-only access is the deliberate security model.

See also: [docs/mac-mini-postgres-setup.md](docs/mac-mini-postgres-setup.md) (Postgres handover, backups, promoting dev data to prod).

## Getting started

### 1. Postgres on Mac Mini

Follow: **[docs/mac-mini-postgres-setup.md](docs/mac-mini-postgres-setup.md)**

### 2. App on MacBook

```bash
cp .env.example .env.local
# DATABASE_URL → Mac Mini Tailscale hostname, resource_manager_dev, rm_admin password

npm install
npm run dev    # applies migrations (when DB reachable), then http://localhost:3000
```

Migrations run automatically before `npm run dev`, `npm run build`, and `npm run start`. Manual: `npm run db:migrate`.

The app starts with **empty reference data** — add roles, resources, and projects in **Admin** as you go. There is no seed bundle; that keeps the first production cut simple.

## What the app does

| Area | Routes | Notes |
|------|--------|--------|
| **Dashboard** | `/` | This week: over-allocated, unplanned, FTE planned, on leave; charts and attention list |
| **Planner — by resource** | `/planner/by-resource` | Weekly grid per person; click/drag weeks to edit allocations; OOO stripes; capacity warnings |
| **Planner — by project** | `/planner/by-project` | Per-project grid; budget burn vs `total_hours_budgeted` |
| **Admin** | `/admin/*` | CRUD for roles, resources, projects, out of office |

Planner grids are scoped to **calendar year 2026** (Jan–Dec). The dashboard uses the **current ISO week** for KPIs.

## Project structure

```
docker/                 Postgres on Mac Mini (compose + init DBs)
docs/
  mac-mini-postgres-setup.md
drizzle/                SQL migrations
src/
  app/(main)/           Dashboard, planner, admin pages
  components/           UI, planner timelines, admin forms
  db/                   Drizzle schema and client
  lib/
    actions/            Server actions (admin + allocations)
    queries/            Data loading for pages
```

## Database schema

| Table | Purpose |
|-------|---------|
| `roles` | Job roles (TMF Lead, Consultant, etc.) |
| `resources` | Team members — name, role, location, default FTE, active/external flags |
| `projects` | Client work — status (pipeline → complete), budget hours, dates, Zoho URL |
| `allocations` | Weekly FTE per resource + project (Monday `week_start`) |
| `out_of_office` | Unavailability ranges per resource |

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Migrations (if DB up), dev server |
| `npm run build` | Migrations (if `DATABASE_URL` set), production build |
| `npm run start` | Migrations, production server |
| `npm run db:migrate` | Apply migrations only (loads `.env.local`) |
| `npm run db:generate` | Generate migration from schema changes |
| `npm run db:studio` | Drizzle Studio |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest (unit tests) |
| `npm run lint` | ESLint |

CI (on push/PR to `main`): typecheck, lint, test, build (`SKIP_DB_MIGRATE=1`).

## Environment variables

| Variable | Description |
|----------|-------------|
| `APP_ENV` | `development` or `production` — header environment badge |
| `DATABASE_URL` | Postgres connection string (dev or prod database name) |

See `.env.example`.

## Roadmap (optional later)

- [ ] Deploy Next.js on Mac Mini against `resource_manager_prod`
- [ ] Planner year range configurable (not hard-coded to 2026)
- [ ] Copy week / fill-forward in planner
- [ ] Calendar view

Core product (admin, planner, dashboard, OOO, budget burn) is **done** for internal use.
