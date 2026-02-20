Updates to apply to local bmad files :
- Use BetterAuth for Authentication

## Story 1.1 — Manual steps remaining

### Task 5.7 — Prisma db push
1. Create a PostgreSQL database (Neon free tier recommended: https://neon.tech)
2. Copy `apps/web/.env.example` to `apps/web/.env` and fill in `DATABASE_URL`
3. Run: `pnpm --filter=@unym/web db:push`

### Tasks 8.2–8.4 — Vercel deployment
1. Go to https://vercel.com → New Project → Import this GitHub repo
2. Set **Root Directory** to `apps/web`
3. Override **Build Command**: `cd ../.. && pnpm turbo build --filter=@unym/web`
4. Override **Install Command**: `pnpm install --frozen-lockfile`
5. Add environment variables:
   - `DATABASE_URL` (from Neon)
   - `SENTRY_DSN` (from https://sentry.io)
   - `SENTRY_AUTH_TOKEN`
   - `NEXT_PUBLIC_APP_URL` (your domain)
6. Connect GitHub for auto-deploys on push to `main`
7. Verify site loads on HTTPS domain and `/api/health` returns `{"status":"ok"}`
