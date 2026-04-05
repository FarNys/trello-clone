# Component Map

## Naming Convention
- Components that encapsulate modal UI + logic should be explicit:
  - `RegisterFormModal`
  - `CreateTaskModal`
  - `EditTaskModal`
- Feature components in `components/features/...`
- UI primitives/composed REUI-like blocks in `components/ui/...`

## Suggested Structure

### Auth
- `components/features/auth/register-form.tsx`
- `components/features/auth/login-form.tsx`
- `components/features/auth/forgot-password-form.tsx`
- `components/features/auth/reset-password-form.tsx`
- `components/features/auth/register-form-modal.tsx`

### Board
- `components/features/board/workspace-sidebar.tsx`
- `components/features/board/board-columns.tsx`
- `components/features/board/board-column.tsx`
- `components/features/board/task-card.tsx`
- `components/features/board/create-task-modal.tsx`
- `components/features/board/edit-task-modal.tsx`

### Reusable UI (shadcn + composed REUI style)
- `components/ui/board-shell.tsx`
- `components/ui/workspace-switcher.tsx`
- `components/ui/task-badge-pill.tsx`
- `components/ui/task-image-grid.tsx`

## Responsibilities
- Server components:
  - Data loading
  - Session checks
  - SSR page composition
- Client components:
  - Form state
  - Dialog visibility
  - Mutation calls (`fetch`)

## Data Contracts in Components
- Keep form-to-API DTO types in `lib/types.ts`.
- Keep status constants in shared domain constants.
- Avoid Prisma types in deep presentation components when possible.
