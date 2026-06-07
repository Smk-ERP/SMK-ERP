# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Commands

```bash
npm run dev               # Start dev server (http://localhost:3000)
npm run build             # prisma generate + next build
npm run lint              # ESLint
npm run db:seed           # (Re-)seed demo data — DESTROYS existing data
npm run prisma:studio     # Open Prisma Studio GUI
npx prisma db push        # Sync schema to DB without a migration file (dev only)
npx prisma migrate dev --name <name>   # Create + apply a named migration
npx prisma migrate deploy              # Apply pending migrations (production)
npx tsc --noEmit          # TypeScript type-check only (no build output)
```

**Demo login** (no password in demo mode): `owner@signmaker.la`

---

## Architecture

### Routing & Layout

- **Next.js 14 App Router**. All authenticated pages live inside `src/app/(dashboard)/` and share `layout.tsx`, which renders `<Sidebar>`, `<Topbar>`, and `<ChatWidget>`.
- `src/app/page.tsx` — redirects `/` → `/dashboard`.
- `src/middleware.ts` — Supabase session guard. If Supabase env vars are absent the middleware is a no-op (demo mode passes through).
- Page pattern: server component at `page.tsx` fetches auth/data, passes props to a `*.client.tsx` file marked `"use client"`.

### Auth (Two Modes)

`src/lib/auth.ts` — `getCurrentUser()` is called in every server component and protected API route.

- **Demo mode** (`NEXT_PUBLIC_SUPABASE_URL` not set): returns the first OWNER row from the DB — no login required.
- **Supabase mode**: resolves Supabase session → looks up `prisma.user` by `supabaseId` or `email`.

**Never check Supabase directly in pages** — always call `getCurrentUser()`.

### Database

- **Prisma + SQLite** in dev (`DATABASE_URL="file:./dev.db"`), **Postgres (Supabase)** in production.
- Schema: `prisma/schema.prisma` — single file covering all phases. All `role` and `status` columns are plain `String` (not Prisma enums) for SQLite compatibility; enum values are enforced in `src/lib/enums.ts` via `as const` arrays.
- Document codes (`CUS-000001`, `QUO-2025-0001`, etc.) generated in `src/lib/codes.ts` using row-count — not production-safe under concurrency, acceptable for Phase 1.
- Brand settings are a singleton row (`id: "singleton"`) in `BrandSetting`, cached in `src/lib/brand.ts` for 30 s.

### API Routes (`src/app/api/`)

All routes follow the same pattern:

1. Call `getCurrentUser()` — return 401 if null.
2. Check `user.role` against allowed roles — return 403.
3. Parse body with **Zod**.
4. Query Prisma.
5. Return `NextResponse.json(...)`.

**RBAC enforcement is entirely in the API routes**, not in middleware. The sidebar/menu visibility in `src/lib/rbac.ts` (`MENU_PERMISSIONS`) is UI-only.

### Notifications + Telegram

`src/lib/notify.ts` — `notify(input)` writes to the `Notification` table then calls `dispatch()` fire-and-forget. `dispatch()` sends Telegram messages to users that have `User.telegramChatId` set.

- **Incoming Telegram bot**: `src/app/api/telegram/webhook/route.ts` — verifies `X-Telegram-Bot-Api-Secret-Token`, maintains per-chat conversation history (in-memory `Map`), calls Claude API, replies.
- **Webhook registration**: `POST /api/telegram/setup` (OWNER/ADMIN_MANAGER only).
- Commands: `/start` shows chat ID; `/chatid` returns the ID; `/clear` resets history.

### AI Chatbot

- **Web widget**: `src/components/layout/chat-widget.tsx` — floating button, streaming `ReadableStream` from `/api/chat`.
- **API route**: `src/app/api/chat/route.ts` — calls `claude-opus-4-7`, system prompt cached with `cache_control: { type: "ephemeral" }`.

### i18n

`src/lib/i18n/` — client-side React context (`useI18n()`). Locale stored in `localStorage` under key `smk.locale`. Dictionaries at `locales/{lo,th,en}.json`. To add a key: add to all three JSON files at the same path, then call `t("path.key")`.

Default body font is **Saysettha OT** (Lao). Font stack: `Saysettha OT → Phetsarath OT → Noto Sans Lao → system`. Font files live in `public/fonts/`. PDF documents use `src/lib/pdf/fonts.ts` which embeds `PhetsarathOT.ttf` directly via `@react-pdf/renderer`.

### Cost Calculator

`src/lib/cost-calculator.ts` — pure functions only (no DB, no React). All money in **THB** internally; currency conversion happens at the quotation layer via `src/lib/currency.ts`. `QuotationItem.costBreakdown` stores a JSON snapshot of the calculation at quote creation time.

### UI Components

`src/components/ui/` — hand-built shadcn-style primitives (not the shadcn CLI). Uses Tailwind CSS variables (`hsl(var(--primary))` etc.) and `brand-gradient` utility class (defined in `globals.css`). Dark mode via `class` strategy — `dark` class on `<html>` toggled by `src/lib/theme.tsx`.

---

## Key Patterns

**Adding a new database column:**
```bash
# 1. Edit prisma/schema.prisma
# 2. In dev:
npx prisma db push
# 3. For production, create a real migration:
npx prisma migrate dev --name add_<column>
```

**Adding a sign type:**
1. Add to `SIGN_TYPES` in `src/lib/enums.ts`
2. Add `SignTypeKey` union + `getDefaultsForSignType()` case in `src/lib/cost-calculator.ts`
3. Add translations in all three `locales/*.json` under `signTypes.<KEY>`

**Adding a locale:**
1. Copy `locales/en.json` → `locales/<code>.json` and translate
2. Add to `LOCALES` and `LOCALE_LABELS` in `src/lib/i18n/config.ts`

---

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | Prisma connection (pooler URL for Supabase) |
| `DIRECT_URL` | Prod only | Prisma migrations (direct Supabase URL) |
| `NEXT_PUBLIC_SUPABASE_URL` | Prod only | Enables Supabase auth (absent = demo mode) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Prod only | Supabase public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Prod only | Server-side Supabase operations |
| `NEXT_PUBLIC_APP_URL` | Yes | Base URL (used in Telegram links, redirects) |
| `ANTHROPIC_API_KEY` | For AI chat | Claude API — chatbot + Telegram bot |
| `TELEGRAM_BOT_TOKEN` | For Telegram | From @BotFather |
| `TELEGRAM_WEBHOOK_SECRET` | For Telegram | Arbitrary secret to verify Telegram POSTs |
| `DEFAULT_CURRENCY` | Optional | `LAK` / `THB` / `USD` (default: `LAK`) |
| `DEFAULT_LANGUAGE` | Optional | `lo` / `th` / `en` (default: `lo`) |

---

## Known Constraints

- `prisma migrate dev` is interactive and will fail in non-TTY environments (CI). Use `prisma db push` for dev schema changes or `prisma migrate deploy` in CI/CD.
- Document code generation (`src/lib/codes.ts`) uses row-count — not safe under concurrent writes. Suitable for Phase 1 low-concurrency use.
- Telegram conversation history is in-memory — lost on server restart. Acceptable for single-process deployment.
- PDF routes (`/api/*/pdf`) have a pre-existing TypeScript error (`Buffer` not assignable to `BodyInit`) that does not affect runtime behavior.
