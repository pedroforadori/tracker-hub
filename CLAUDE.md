# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Structure

pnpm workspace with three apps.

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
pnpm dev:all            # all three in parallel

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

## Environment Variables

Each app has its own `.env.example`. Copy and fill before running locally.

**`apps/api/.env`**
```
DATABASE_URL="postgresql://tracker:tracker_pass@localhost:5433/tracker_hub"
JWT_SECRET=
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=re_...
RESEND_FROM="Tracker Hub <noreply@trackerhub.com.br>"
```

**`apps/landing-page/.env.local`**
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3333
NEXT_PUBLIC_WEB_URL=http://localhost:5173
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
    billing/            # Stripe subscription management + webhook handler
    mail/               # Resend email service (payment-failed, checkout-welcome)
  prisma/               # PrismaModule (global), PrismaService
  main.ts               # Swagger at /api/docs with Bearer auth
```

**User limit logic** (`users.service.ts`): count USERs in tenant, throw `ForbiddenException` if >= 3.  
**Prisma schema:** models `Tenant`, `User`, `Customer`, `Vehicle`, `Tracker`, `Chip` — all with `tenantId`. `Tenant` also carries `planStatus` (enum: `TRIALING | ACTIVE | PAST_DUE | BLOCKED | CANCELED`), Stripe IDs, and grace period fields.  
**DO NOT upgrade Prisma to v7** — v7 removed `url = env()` from schema.prisma (major breaking change).

**Billing gate (in `JwtAuthGuard`):** After JWT validation, every request checks the tenant's `planStatus` in Prisma (cached for 15 s in-memory via `billingCache` map). `BLOCKED` tenants get `PaymentRequiredException`. Billing endpoints (`/billing/*`) bypass this check. Call `invalidateBillingCache(tenantId)` after any status change in `BillingService`.

**Stripe webhook:** `POST /billing/webhook` (raw body, `@Public()`) verifies the Stripe signature, then handles events (`invoice.payment_failed`, `customer.subscription.*`, etc.) and updates `Tenant.planStatus`. Sends email via `MailService` on payment failure.

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
    dashboard/              # DashboardPage (summary stats)
    team/                   # TeamPage (ADMIN only) + TeamForm + progress bar
    customers/              # CRUD + CustomerForm (CNPJ/phone masks)
    vehicles/               # CRUD + VehicleForm (plate mask, year NumericFormat)
    trackers/               # CRUD + TrackerForm (IMEI NumericFormat)
    chips/                  # CRUD + ChipForm
    billing/                # BillingPage (plan status, Stripe card update via SetupIntent)
  components/
    atoms/    ThemeProvider, ThemeToggle
    molecules/ FormField
    organisms/ FormEntity (demo form)
```

**Form pattern:** Same component for create/edit via `initialData?: Partial<Entity>`. Validation with `zodResolver`, `mode: 'onBlur'`. Masks via `react-number-format` (`PatternFormat`/`NumericFormat`).

**Billing page:** Fetches `GET /billing/status` to show `planStatus`, trial/grace countdowns, and card info. Payment method updates use `POST /billing/setup-intent` to get a Stripe `clientSecret`, then `CardUpdateForm` collects the new card via Stripe Elements.

**Testing:** Vitest (not Jest) — web app uses `"type": "module"`. Path alias `@/` → `src/`.

### Landing Page (`apps/landing-page/`) — Next.js 16

App Router. Atomic Design in `src/components/` (atoms/molecules/organisms). Jest + `next/jest` for tests. `setupFilesAfterEnv` (not `setupFilesAfterFramework`).

**Checkout flow:**  
1. User clicks CTA → `POST /api/checkout` (Next.js route handler in `app/api/checkout/route.ts`) creates a Stripe Checkout Session and returns `{ url }`.  
2. Browser redirects to Stripe-hosted checkout.  
3. On success, Stripe redirects to `/contratado?session_id=...`.  
4. `/contratado` (server component) retrieves the session, and if `payment_status === 'paid'`, calls `POST /mail/checkout-welcome` on the API to send a welcome email with the register link.

**Email service (`src/services/email/`):** Interface `IEmailService` with `MockEmailService` (dev/test) and `ResendEmailService` (production). Injected via `AppContext`.

## First-time Database Setup

```bash
# 1. Open Docker Desktop
pnpm db:up
pnpm prisma:migrate    # runs: prisma migrate dev
pnpm prisma:generate
pnpm dev:api           # Swagger at http://localhost:3333/api/docs
```
