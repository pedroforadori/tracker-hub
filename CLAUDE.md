# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Structure

pnpm workspace with three apps. All dependency installs require `--ignore-scripts` (pnpm 11 alpha restriction).

```
apps/
  landing-page/   Next.js 16 + Tailwind CSS 4 + App Router (port 3000)
  web/            React 19 + Vite 8 + TypeScript (port 5173)
  api/            NestJS 11 + Prisma 6 + JWT auth (port 3333)
docker/
  docker-compose.yml  PostgreSQL 16
```

## Commands

```bash
# Database (Docker Desktop must be running)
pnpm db:up              # start PostgreSQL
pnpm db:down            # stop
pnpm prisma:generate    # regenerate Prisma Client after schema changes
pnpm prisma:migrate     # run migrations

# Dev servers
pnpm dev:api            # NestJS → :3333
pnpm dev:web            # Vite → :5173
pnpm dev:landing        # Next.js → :3000

# Tests
pnpm test:all           # all apps
pnpm --filter api test              # Jest (NestJS unit tests)
pnpm --filter web test              # Vitest
pnpm --filter landing-page test     # Jest

# Single test file (web/landing)
pnpm --filter web test -- src/components/organisms/__tests__/FormEntity.smoke.test.tsx

# Build
pnpm build:all

# Installing new packages (always --ignore-scripts)
pnpm add <pkg> --filter <app> --ignore-scripts
```

## Architecture

### API (`apps/api/`) — NestJS + Prisma 6 + JWT

**Auth flow:** `POST /auth/register` creates Tenant + ADMIN user → returns JWT. `POST /auth/login` → JWT.  
**Guard:** `JwtAuthGuard` is registered as `APP_GUARD` (global) in AppModule. Use `@Public()` decorator to skip it.  
**Roles:** `@Roles(UserRole.ADMIN)` + `RolesGuard` restrict endpoints to admins only.  
**Multi-tenant isolation:** Every query includes `{ where: { tenantId: req.user.tenantId } }`.

```
src/
  auth/                 # JWT strategy, guards, @Public(), @Roles(), DTOs
  modules/
    users/              # Team management (MAX 3 USERs per tenant)
    customers/          # Customer CRUD (tenantId isolated)
    vehicles/           # Vehicle CRUD (linked to Customer)
    trackers/           # Tracker CRUD (linked to Vehicle)
    chips/              # Chip CRUD (1:1 with Tracker)
  prisma/               # PrismaModule (global), PrismaService
  main.ts               # Swagger at /api/docs with Bearer auth
```

**User limit logic** (`users.service.ts`): count USERs in tenant, throw `ForbiddenException` if >= 3.  
**Prisma schema:** models `Tenant`, `User`, `Customer`, `Vehicle`, `Tracker`, `Chip` — all with `tenantId`.  
**DO NOT upgrade Prisma to v7** — v7 removed `url = env()` from schema.prisma (major breaking change).

### Web Dashboard (`apps/web/`) — React 19 + Vite + TypeScript

**Auth:** `useAuthStore` (Zustand + localStorage persist) stores `token` + `user`. Axios interceptor attaches Bearer token automatically. 401 response triggers `logout()`.

**Routing:** `BrowserRouter` → `ProtectedRoute` (redirects to `/login`) → `MainLayout` (sidebar) → feature pages.  
**Admin-only routes:** `<ProtectedRoute allowedRoles={['ADMIN']}>` wraps `/team`.

**Data fetching:** Pages use React 19 `use(promise)` + module-level promise variable + `<Suspense fallback={<TableSkeleton />}>`. Invalidation reassigns the promise variable and forces re-render with `key={refresh}`.

```
src/
  shared/
    api/client.ts           # axios instance with JWT interceptor
    store/authStore.ts      # Zustand auth store (persisted)
    types/api.ts            # TypeScript interfaces for all entities
    components/
      ProtectedRoute.tsx    # redirect guard
      MainLayout.tsx        # sidebar + header
      LoadingSkeleton.tsx   # TableSkeleton, FormSkeleton
  features/
    auth/                   # LoginPage + auth.api.ts
    team/                   # TeamPage (ADMIN only) + TeamForm + progress bar
    customers/              # CRUD + CustomerForm (CNPJ/phone masks)
    vehicles/               # CRUD + VehicleForm (plate mask, year NumericFormat)
    trackers/               # CRUD + TrackerForm (IMEI NumericFormat)
    chips/                  # CRUD + ChipForm
  components/
    atoms/    ThemeProvider, ThemeToggle
    molecules/ FormField
    organisms/ FormEntity (demo form)
```

**Form pattern:** Same component for create/edit via `initialData?: Partial<Entity>`. Validation with `zodResolver`, `mode: 'onBlur'`. Masks via `react-number-format` (`PatternFormat`/`NumericFormat`).

**Testing:** Vitest (not Jest) — web app uses `"type": "module"`. Path alias `@/` → `src/`.

### Landing Page (`apps/landing-page/`) — Next.js 16

App Router. Atomic Design in `src/components/`. Jest + `next/jest` for tests. `setupFilesAfterEnv` (not `setupFilesAfterFramework`).

## First-time Database Setup

```bash
# 1. Open Docker Desktop
pnpm db:up
pnpm prisma:migrate    # runs: prisma migrate dev
pnpm prisma:generate
pnpm dev:api           # Swagger at http://localhost:3333/api/docs
```
