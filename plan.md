# Trello Clone Plan

## Project Goal
Build a small-scale Trello clone using Next.js App Router + TypeScript with:
- `shadcn/ui` + REUI-style composed components
- Prisma + SQLite (local first)
- Auth.js credentials auth
- SSR data loading and Next.js revalidation
- Native `fetch` for API calls (no Axios, no React Query)

## Milestone 1: Project Foundations
1. Prepare `docs/` references and lock architecture decisions.
2. Add Prisma, Auth.js, adapter, and password hashing dependencies.
3. Configure `.env` with `DATABASE_URL` and auth secrets.
4. Add Prisma schema for auth + domain models.
5. Generate client and run first migration.

## Milestone 2: Data + Auth Core
1. Configure Auth.js credentials flow.
2. Add registration endpoint with password hashing.
3. Add forgot/reset password endpoints with token table.
4. Protect app routes and redirect unauthenticated users to login.
5. Seed baseline workspace and demo badges (optional but useful).

## Milestone 3: Core Domain APIs
1. Implement workspace endpoints.
2. Implement task endpoints (create, read, update, delete).
3. Implement image upload endpoint (local disk to `public/uploads`).
4. Add badge assignment behavior in task create/update payload.
5. Revalidate board/workspace tags after mutations.

## Milestone 4: SSR Board Experience
1. Add route groups: `/(auth)` and `/(app)`.
2. Build SSR board page with 4 columns:
   - `BACKLOG`
   - `NEW`
   - `IN_PROGRESS`
   - `DONE`
3. Fetch board/workspaces server-side and cache with tags.
4. Add sidebar with workspace list and task counts.
5. Add task modal flows for create/edit.

## Milestone 5: UI Composition Cleanup
1. Split feature UI into focused components:
   - `RegisterFormModal`
   - `CreateTaskModal`
   - `WorkspaceSidebar`
   - `TaskCard`
2. Keep composed/advanced visual primitives inside `components/ui`.
3. Keep interaction client-side only where needed.
4. Avoid over-optimization (`useMemo`/`useCallback`) unless truly needed.

## Milestone 6: Stability and Validation
1. Add `app/global-error.tsx` and app-level `error.tsx`.
2. Run `lint`, `typecheck`, Prisma migrate checks.
3. Test auth flows, task lifecycle, badges, and image upload.
4. Verify SSR revalidation works without hard refresh.
5. Update docs to match final code paths and payload shapes.

## Definition of Done
- User can register/login/logout.
- Forgot/reset password works for local/dev flow.
- Authenticated users can manage workspaces/tasks.
- Tasks support title, description, status, badges, and images.
- Sidebar shows workspaces with counts.
- Board uses SSR data + revalidation.
- Global error boundary prevents app-wide crash.
