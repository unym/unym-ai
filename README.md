# unym

Privacy-preserving AI proxy — detects and anonymizes PII before it leaves your browser.

## Stack

| Layer | Tech |
|-------|------|
| Monorepo | pnpm workspaces + Turborepo |
| Web app | Next.js 16 (App Router), TypeScript, Tailwind CSS v4 |
| Auth | BetterAuth (email/password + Google OAuth) |
| Database | PostgreSQL via Prisma |
| Extension | WXT (Chrome) |
| Deployment | Vercel (web) |

## Prerequisites

- Node.js ≥ 20
- pnpm 10 (`npm install -g pnpm`)
- Docker + Docker Compose (for local DB or full Docker dev)

---

## Quick start — native

The fastest local setup: run PostgreSQL in Docker, the web app natively.

### 1. Clone and install

```bash
git clone <repo>
cd unym-v2
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Point to local Docker postgres (see step 3)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/unym"

BETTER_AUTH_SECRET="<generate: openssl rand -base64 32>"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional: Google OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

### 3. Start PostgreSQL

```bash
docker compose up db -d
```

### 4. Apply database schema

```bash
cd apps/web
npx prisma db push
cd ../..
```

### 5. Start the web app

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Docker Compose — full stack

Runs both PostgreSQL and the Next.js web app in containers with hot reload.

### 1. Configure environment

```bash
cp .env.example .env
```

Set at minimum:
```env
BETTER_AUTH_SECRET="<generate: openssl rand -base64 32>"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

`DATABASE_URL` is automatically set to the compose postgres service — no need to configure it.

### 2. Build and start

```bash
docker compose up --build
```

First run takes ~1 minute (installs dependencies inside the image).

### 3. Apply database schema (first run only)

In a separate terminal:

```bash
docker compose exec web sh -c "cd apps/web && npx prisma db push"
```

Open [http://localhost:3000](http://localhost:3000).

### Useful compose commands

```bash
# Start in background
docker compose up -d

# View web app logs
docker compose logs -f web

# Restart only the web app
docker compose restart web

# Stop everything
docker compose down

# Stop and remove volumes (wipes the database)
docker compose down -v
```

---

## Project structure

```
unym-v2/
├── apps/
│   ├── web/               # Next.js web app + API
│   │   ├── app/           # App Router pages
│   │   │   ├── (marketing)/   # Public pages (no auth)
│   │   │   ├── (app)/         # Auth-guarded pages
│   │   │   ├── auth/          # Login / register pages
│   │   │   └── api/           # API routes
│   │   ├── components/    # React components
│   │   ├── lib/           # auth.ts, auth-client.ts, db.ts
│   │   └── prisma/        # schema.prisma
│   └── extension/         # Chrome extension (WXT)
├── packages/
│   ├── core/              # Shared business logic
│   ├── ui/                # Shared UI components
│   └── tsconfig/          # Shared TypeScript configs
├── .env.example           # Environment variable template
├── docker-compose.yml     # Dev stack (postgres + web)
└── Dockerfile.dev         # Dev image for web app
```

## Scripts

Run from the repo root:

```bash
pnpm dev          # Start all apps in dev mode
pnpm build        # Build all apps
pnpm lint         # Lint all packages
pnpm test         # Run all tests
```

Run for a specific app:

```bash
pnpm --filter @unym/web dev
pnpm --filter @unym/web build
```

## Database

```bash
# Apply schema changes to the database
cd apps/web && npx prisma db push

# Open Prisma Studio (DB browser)
cd apps/web && npx prisma studio

# Generate Prisma client after schema changes
cd apps/web && npx prisma generate
```

## Google OAuth setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Create an OAuth 2.0 Client ID (Web application)
3. Add authorised redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Copy Client ID and Secret to `.env`

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | Random 32+ char secret (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | Yes | App base URL (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_APP_URL` | Yes | Same as `BETTER_AUTH_URL` (exposed to browser) |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `SENTRY_DSN` | No | Sentry error tracking (server) |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Sentry error tracking (client) |
