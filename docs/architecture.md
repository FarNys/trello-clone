# Architecture Notes

## High-Level Stack
- Framework: Next.js (App Router, SSR-first)
- Language: TypeScript
- UI: `shadcn/ui` primitives + REUI-inspired composed components
- Data: Prisma ORM + SQLite (local-first for a non-large-scale app)
- Auth: Auth.js credentials provider + Prisma adapter
- Uploads: Local filesystem storage under `public/uploads`

## Rendering Strategy
- App pages in `/(app)` are server-rendered by default.
- Board/workspace data is loaded on the server.
- API writes trigger `revalidateTag` / `revalidatePath`.
- Client components are used for local interactions (form submit, dialogs, menus).

## Data Flow
1. User interacts with client UI (e.g., submit task form).
2. Client sends request using native `fetch` to Next.js route handlers.
3. Route handlers execute Prisma operations.
4. Route handlers trigger revalidation tags/paths.
5. Next SSR pages re-fetch fresh data on next render/navigation.

## Route Grouping
- `app/(auth)`:
  - `/login`
  - `/register`
  - `/forgot-password`
  - `/reset-password/[token]`
- `app/(app)`:
  - `/board`
  - `/workspace/[id]` (optional alternate board filtering view)

## Error Strategy
- Lightweight local checks inside handlers/components.
- Global safety net via:
  - `app/global-error.tsx`
  - app-level `error.tsx`

## Non-Goals (v1)
- No React Query/Zustand/socket setup.
- No advanced infra (queue/email providers/object storage).
- No heavy optimization or complex fallback logic.
