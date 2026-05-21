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

Copy `.env.example` to `apps/web/.env.local` and `apps/admin/.env.local` once you create a Supabase project. The keys are picked up automatically by both Next.js apps.

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>    # admin app / server-only
```

**Never commit `.env*` files.** The service-role key must stay server-side only and never be exposed via `NEXT_PUBLIC_*`.

## Database (Supabase)

The schema lives in `supabase/` and is plain SQL — apply it with whichever tool you prefer:

**Option A — Supabase dashboard (simplest)**

1. Create a project at https://supabase.com.
2. Open **SQL Editor** → paste the contents of `supabase/migrations/0001_initial.sql` → **Run**.
3. (Optional, local dev only) Paste `supabase/seed.sql` → **Run**. The seed creates a demo author (`demo-author@guangyu.local`) and a sample novel with two chapters. Skip this on production.

**Option B — Supabase CLI**

```bash
npm i -g supabase
supabase login
supabase link --project-ref <your-project-ref>
supabase db push          # applies supabase/migrations/*.sql
psql "$DATABASE_URL" -f supabase/seed.sql   # local-dev seed only
```

The migration:

- Creates 9 tables — `profiles`, `authors`, `categories`, `novels`, `chapters`, `banners`, `site_settings`, `bookmarks`, `reading_history`.
- Defines enums `user_role`, `novel_status`, `chapter_status`.
- Adds a `handle_new_user` trigger so every new `auth.users` row gets a matching `profiles` row.
- Enables RLS on every table with policies:
  - public can read **published** novels/chapters, active banners, all categories, all site_settings, all author profiles
  - authors can read & manage their own novels and chapters
  - admin / superadmin can manage all content
  - superadmin can manage users and roles
  - bookmarks / reading_history are private per user (superadmin read-only)

## Deployment

To be configured in Phase 10. Plan: create **two** Vercel projects, both pointing at this repo:

| App         | Vercel root directory | Domain         |
| ----------- | --------------------- | -------------- |
| Reader site | `apps/web`            | `guangyu.xxx`  |
| Admin       | `apps/admin`          | `admin.guangyu.xxx` |

## Roadmap

- [x] **Phase 0** — Monorepo foundation
- [x] **Phase 1** — Supabase schema, RLS, seeds
- [x] **Phase 2** — Auth & role-based routing
- [ ] Phase 3 — Superadmin CMS
  - [x] 3a — Categories CMS
  - [x] 3b — Novels CMS
  - [x] 3c — Chapters CMS
  - [x] 3d — Banners CMS + homepage integration
  - [x] 3e — Users management CMS (superadmin)
- [ ] Phase 4 — Author dashboard
- [ ] Phase 5 — Reader frontend
- [ ] Phase 6 — Site settings CMS
- [ ] Phase 7 — Reader accounts (bookmarks, history)
- [ ] Phase 8 — SEO & performance
- [ ] Phase 9 — QA pass
- [ ] Phase 10 — Vercel deployment
