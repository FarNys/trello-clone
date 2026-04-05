# Database Schema Reference (Prisma + SQLite)

## Enums
- `TaskStatus`
  - `BACKLOG`
  - `NEW`
  - `IN_PROGRESS`
  - `DONE`

## Core Models
- `User`
  - Auth.js base fields + `passwordHash`
  - Relations: workspaces, tasks, reset tokens
- `Workspace`
  - `id`, `name`, `ownerId`, timestamps
  - Relations: owner, tasks
- `Task`
  - `id`, `title`, `description`, `status`, `workspaceId`, `creatorId`, timestamps
  - Relations: workspace, creator, images, badge links
- `TaskImage`
  - `id`, `taskId`, `url`, `fileName`, `createdAt`
- `Badge`
  - `id`, `name`, `color`, `createdAt`
- `TaskBadge` (join table)
  - `taskId`, `badgeId` (composite unique)
- `PasswordResetToken`
  - `id`, `userId`, `token`, `expiresAt`, `createdAt`

## Auth.js Adapter Models
- `Account`
- `Session`
- `VerificationToken`

## Recommended Indexing
- `Task.workspaceId`
- `Task.status`
- `Task.creatorId`
- `PasswordResetToken.token` (unique)
- `Workspace.ownerId`

## Deletion Behavior
- Deleting a workspace cascades tasks.
- Deleting a task cascades task images and task-badge links.
- Deleting a user cascades owned workspaces/tasks and reset tokens (or restrict, based on final business rule).
