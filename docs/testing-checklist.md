# Testing Checklist (Manual + Basic Automation)

## Auth
- [ ] Register with valid credentials succeeds.
- [ ] Register with existing email is blocked.
- [ ] Login with valid credentials redirects to board.
- [ ] Login with invalid password shows error.
- [ ] Forgot password returns success flow.
- [ ] Reset password with valid token updates password.
- [ ] Reset password with invalid/expired token fails gracefully.

## Route Protection
- [ ] Unauthenticated user opening `/board` is redirected to `/login`.
- [ ] Authenticated user can access `/board`.

## Workspace
- [ ] Create workspace appears in sidebar.
- [ ] Sidebar shows task count per workspace.
- [ ] Switching workspace updates board items.

## Task Lifecycle
- [ ] Create task with title + description.
- [ ] Create task in each status column.
- [ ] Edit task status and verify column change.
- [ ] Delete task removes it from board.

## Badges + Images
- [ ] Add one or more badge names to task.
- [ ] Upload one or more images to task.
- [ ] Uploaded images display in task details/card.

## SSR + Revalidation
- [ ] After create/update/delete task, board reflects latest data without hard refresh.
- [ ] After creating workspace, sidebar refreshes via revalidation.

## Error Boundaries
- [ ] Simulated runtime error renders app-level fallback.
- [ ] Global error boundary prevents full white-screen crash.

## Dev Quality Gate
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] Prisma migration runs successfully.
