# 光羽小说 (Guangyu Novel)

Scalable Chinese novel platform — monorepo containing a public reader site, an admin/author dashboard, and shared packages.

> **Status:** Phase 0 — project foundation only. No business features yet.

## Tech stack

- pnpm workspaces (monorepo)
- Next.js 15 (App Router) + React 19
- TypeScript
- Tailwind CSS
- Supabase (added in Phase 1)
- Deployed on Vercel (separate projects per app)

## Structure

```
apps/
  web/      # Public reader site (port 3000)
  admin/    # Admin + author dashboard (port 3001)
packages/
  ui/       # Shared React components
  database/ # Shared types & (later) Supabase client
  config/   # Shared constants
```

## Prerequisites

- Node.js >= 20 (see `.nvmrc`)
- pnpm >= 9 (`npm i -g pnpm`)

## Install

```bash
pnpm install
```

## Run locally

Reader site:

```bash
pnpm dev:web
# → http://localhost:3000
```

Admin dashboard:

```bash
pnpm dev:admin
# → http://localhost:3001
```

Both can run in parallel (different ports).

## Other scripts

```bash
pnpm build       # build all apps & packages
pnpm typecheck   # tsc --noEmit across the workspace
pnpm lint        # next lint per app
```

## Environment variables

Phase 0 does not require any env vars. Copy `.env.example` to `apps/web/.env.local` and `apps/admin/.env.local` once Phase 1 lands (Supabase).

**Never commit `.env*` files.** The service-role key must stay server-side only.

## Deployment

To be configured in Phase 10. Plan: create **two** Vercel projects, both pointing at this repo:

| App         | Vercel root directory | Domain         |
| ----------- | --------------------- | -------------- |
| Reader site | `apps/web`            | `guangyu.xxx`  |
| Admin       | `apps/admin`          | `admin.guangyu.xxx` |

## Roadmap

- [x] **Phase 0** — Monorepo foundation
- [ ] Phase 1 — Supabase schema, RLS, seeds
- [ ] Phase 2 — Auth & role-based routing
- [ ] Phase 3 — Superadmin CMS
- [ ] Phase 4 — Author dashboard
- [ ] Phase 5 — Reader frontend
- [ ] Phase 6 — Site settings CMS
- [ ] Phase 7 — Reader accounts (bookmarks, history)
- [ ] Phase 8 — SEO & performance
- [ ] Phase 9 — QA pass
- [ ] Phase 10 — Vercel deployment
