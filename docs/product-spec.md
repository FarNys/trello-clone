# Product Spec (v1)

## Goal
Create a Trello-like board app for authenticated users with simple project/task management.

## User Stories
1. As a new user, I can register an account.
2. As a user, I can log in and access the board.
3. As a user, I can request a password reset and set a new password.
4. As a logged-in user, I can create workspaces/categories.
5. As a logged-in user, I can create tasks with:
   - title
   - description
   - images
   - badges
   - status column
6. As a logged-in user, I can move/update tasks across statuses:
   - `BACKLOG`
   - `NEW`
   - `IN_PROGRESS`
   - `DONE`
7. As a logged-in user, I can browse workspaces in a sidebar and see task counts.

## Core Screens
- Login page
- Register page
- Forgot password page
- Reset password page
- Board page (default app page)
- Workspace-focused board view (optional route variant)

## UX Principles
- Minimal visual style.
- Clear column-based task organization.
- Composable UI with small focused components.
- Modal-driven CRUD for clean workflow.

## Constraints
- Use native `fetch` for API communication.
- Use SSR and Next.js revalidation features for freshness.
- Avoid over-optimization (`useMemo`, `useCallback`) unless necessary.
