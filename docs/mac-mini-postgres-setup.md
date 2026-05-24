# Mac Mini Postgres Setup — Resource Manager

Handover document for getting Postgres running on the Mac Mini with **dev** and **prod** databases, accessible from your MacBook via Tailscale.

---

## Overview

| Item | Value |
|---|---|
| **Host** | Mac Mini (always on, Tailscale) |
| **Engine** | Postgres 16 (Docker) |
| **Dev database** | `resource_manager_dev` |
| **Prod database** | `resource_manager_prod` |
| **Admin user** | `rm_admin` |
| **Port** | `5432` (Tailscale network only) |

Your MacBook runs the Next.js dev server and connects to `resource_manager_dev` on the Mac Mini. When you deploy the app to the Mac Mini later, it connects to `resource_manager_prod`.

---

## Prerequisites (Mac Mini)

1. **Docker Desktop** installed and running  
   Download: https://www.docker.com/products/docker-desktop/

2. **Tailscale** installed and signed in (same tailnet as your MacBook)  
   Download: https://tailscale.com/download

3. **MagicDNS enabled** in the Tailscale admin console (Admin → DNS → Enable MagicDNS)  
   This lets you reach the Mac Mini as `your-mac-mini-name` instead of chasing IP addresses.

4. **Git** (to clone the repo) or copy the `docker/` folder manually.

---

## Step 1 — Clone the repo on the Mac Mini

```bash
cd ~
git clone <your-repo-url> resource_manager
cd resource_manager/docker
```

If you haven't pushed the repo yet, copy the `docker/` folder to the Mac Mini via AirDrop, SCP, or shared drive.

---

## Step 2 — Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set a strong password:

```
POSTGRES_PORT=5432
POSTGRES_PASSWORD=<choose-a-strong-password>
```

**Save this password** — you'll need it for connection strings on both machines.

---

## Step 3 — Start Postgres

```bash
docker compose up -d
```

Verify it's running:

```bash
docker compose ps
docker compose logs postgres
```

You should see the container `resource-manager-db` in state **running**, and logs showing Postgres is ready.

---

## Step 4 — Confirm databases were created

```bash
docker compose exec postgres psql -U rm_admin -d postgres -c "\l"
```

Expected output includes:

```
 resource_manager_dev  | rm_admin | ...
 resource_manager_prod | rm_admin | ...
```

> **Note:** Init scripts in `docker/init/` only run on **first start** (empty volume). If you need to re-run them, you must remove the volume first (`docker compose down -v`) — this deletes all data.

---

## Step 5 — Run schema migrations (dev first)

From your **MacBook** (once Postgres is up), or from the Mac Mini:

```bash
# From repo root
cp .env.example .env.local
```

Edit `.env.local`:

```
APP_ENV=development
DATABASE_URL=postgres://rm_admin:YOUR_PASSWORD@YOUR-MAC-MINI-NAME:5432/resource_manager_dev
```

Replace:
- `YOUR_PASSWORD` — from `docker/.env`
- `YOUR-MAC-MINI-NAME` — Tailscale hostname (e.g. `mac-mini` or `rob-mac-mini`)

Run the initial migration:

```bash
npm install
npm run db:migrate
```

Or apply manually:

```bash
psql "$DATABASE_URL" -f drizzle/0000_initial_schema.sql
```

Repeat for prod when ready:

```bash
DATABASE_URL=postgres://rm_admin:YOUR_PASSWORD@YOUR-MAC-MINI-NAME:5432/resource_manager_prod npm run db:migrate
```

---

## Step 6 — Test connection from MacBook

```bash
# Install psql if needed: brew install libpq
psql "postgres://rm_admin:YOUR_PASSWORD@YOUR-MAC-MINI-NAME:5432/resource_manager_dev" -c "SELECT 1"
```

Start the app:

```bash
npm run dev
```

Open http://localhost:3000 — the header badge should show **Development · Connected**, and the home page should show **Database: Connected to Postgres**.

---

## Connection strings reference

| Where | Host | Database |
|---|---|---|
| MacBook dev | `YOUR-MAC-MINI-NAME` (Tailscale) | `resource_manager_dev` |
| Mac Mini prod app | `postgres` (Docker network) | `resource_manager_prod` |
| Mac Mini local admin | `localhost` | either |

**MacBook `.env.local` (development):**

```
APP_ENV=development
DATABASE_URL=postgres://rm_admin:PASSWORD@mac-mini:5432/resource_manager_dev
```

**Mac Mini prod `.env` (when app is deployed in Docker later):**

```
APP_ENV=production
DATABASE_URL=postgres://rm_admin:PASSWORD@postgres:5432/resource_manager_prod
```

---

## Security notes

- Postgres is exposed on port 5432 to the Mac Mini's network interfaces. It is **not** exposed to the public internet as long as you don't port-forward on your router.
- Access is limited to devices on your **Tailscale tailnet**.
- Do not commit `.env` or `.env.local` files — they are gitignored.
- Use different passwords for admin vs app users if you harden later (optional for solo use).

---

## Day-to-day operations

### Stop / start Postgres

```bash
cd ~/resource_manager/docker
docker compose stop
docker compose start
```

### View logs

```bash
docker compose logs -f postgres
```

### Backup a database

```bash
docker compose exec postgres pg_dump -U rm_admin resource_manager_prod > backup_prod_$(date +%Y%m%d).sql
```

### Restore a database

```bash
cat backup_prod_20260524.sql | docker compose exec -T postgres psql -U rm_admin -d resource_manager_prod
```

### Reset everything (destructive)

```bash
docker compose down -v   # removes container AND data volume
docker compose up -d     # re-runs init scripts
npm run db:migrate       # re-applies schema
```

---

## Troubleshooting

### Can't connect from MacBook

1. Confirm Mac Mini is online in Tailscale admin
2. Ping the hostname: `ping your-mac-mini-name`
3. Check Docker is running on Mac Mini: `docker compose ps`
4. Verify password in connection string matches `docker/.env`
5. On Mac Mini, test locally: `psql -h localhost -U rm_admin -d resource_manager_dev`

### Init scripts didn't create databases

Init scripts only run when the data volume is empty. If you started Postgres before adding init scripts:

```bash
docker compose down -v
docker compose up -d
```

Or create databases manually:

```bash
docker compose exec postgres psql -U rm_admin -d postgres -c "CREATE DATABASE resource_manager_dev;"
docker compose exec postgres psql -U rm_admin -d postgres -c "CREATE DATABASE resource_manager_prod;"
```

### Port 5432 already in use

Change `POSTGRES_PORT` in `docker/.env` to e.g. `5433`, then update connection strings accordingly.

---

## Access control (no app login)

Resource Manager does not implement users or passwords. Security relies on:

- Postgres and (when deployed) the Next.js app being reachable **only on the Tailscale tailnet**
- A strong database password in `docker/.env`
- Optional **Tailscale ACLs** to limit which devices can reach the Mac Mini

Do not port-forward Postgres or the app to the public internet without adding application auth.

---

## Promote dev data to prod

When you are ready to use real data in production (e.g. after planning in `resource_manager_dev`), copy the dev database into prod on the Mac Mini.

**1. Ensure both databases exist and migrations are applied on both:**

```bash
cd ~/resource_manager   # or your clone path
npm run db:migrate      # with DATABASE_URL pointing at dev, then repeat for prod
```

**2. Dump dev and restore into prod (on Mac Mini, from `docker/`):**

```bash
# Dump dev (custom format — easy to restore with clean)
docker compose exec -T postgres pg_dump -U rm_admin -Fc resource_manager_dev > /tmp/rm_dev.dump

# Replace prod contents (destructive — backs up prod first if you care)
docker compose exec -T postgres pg_dump -U rm_admin -Fc resource_manager_prod > /tmp/rm_prod_backup_$(date +%Y%m%d).dump

docker compose exec -T postgres dropdb -U rm_admin resource_manager_prod
docker compose exec -T postgres createdb -U rm_admin -O rm_admin resource_manager_prod
docker compose exec -T postgres pg_restore -U rm_admin -d resource_manager_prod --no-owner --role=rm_admin < /tmp/rm_dev.dump
```

**3. Point production app at prod:**

Set `DATABASE_URL` to `resource_manager_prod` and `APP_ENV=production` in the Mac Mini app environment (not on `.env.local` committed to git).

**4. Keep using dev for experiments**

After promotion, `resource_manager_dev` is unchanged. You can drop and recreate dev later, or refresh it from prod with the same dump/restore steps in reverse.

---

## What happens next

- Run the app against **prod** on the Mac Mini when you want a always-on URL on the tailnet (`npm run build && npm run start`, or a process manager — not yet scripted in this repo).
- See the main [README](../README.md) for app commands and the Tailscale access model.

---

## Quick checklist

- [ ] Docker Desktop running on Mac Mini
- [ ] Tailscale connected, MagicDNS on
- [ ] `docker/.env` created with strong password
- [ ] `docker compose up -d` running
- [ ] `resource_manager_dev` and `resource_manager_prod` exist
- [ ] Migration applied to dev database
- [ ] `.env.local` on MacBook with Tailscale hostname
- [ ] `npm run dev` shows green database status

---

*Last updated: May 2026*
