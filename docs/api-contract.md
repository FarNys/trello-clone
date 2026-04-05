# API Contract (v1)

## Conventions
- JSON request/response unless file upload endpoint.
- Auth required for app domain endpoints (workspace/task/upload).
- Native `fetch` from UI.
- Write endpoints trigger revalidation tags.

## Auth Endpoints

### `POST /api/auth/register`
- Body:
```json
{
  "name": "Jane",
  "email": "jane@example.com",
  "password": "secret123"
}
```
- Response (201):
```json
{
  "ok": true
}
```

### `POST /api/auth/forgot-password`
- Body:
```json
{
  "email": "jane@example.com"
}
```
- Response (200):
```json
{
  "ok": true,
  "resetToken": "dev-token-optional"
}
```

### `POST /api/auth/reset-password`
- Body:
```json
{
  "token": "token-value",
  "password": "newSecret123"
}
```
- Response (200):
```json
{
  "ok": true
}
```

## Workspace Endpoints

### `GET /api/workspaces`
- Response:
```json
{
  "workspaces": [
    {
      "id": "ws_1",
      "name": "Frontend",
      "taskCount": 6
    }
  ]
}
```

### `POST /api/workspaces`
- Body:
```json
{
  "name": "Frontend"
}
```
- Response (201):
```json
{
  "workspace": {
    "id": "ws_1",
    "name": "Frontend"
  }
}
```

## Task Endpoints

### `GET /api/tasks?workspaceId=...`
- Response:
```json
{
  "tasks": [
    {
      "id": "task_1",
      "title": "Build auth form",
      "description": "Use shadcn form fields",
      "status": "NEW",
      "workspaceId": "ws_1",
      "badges": [{"id":"b1","name":"frontend","color":"blue"}],
      "images": [{"id":"img1","url":"/uploads/a.png"}]
    }
  ]
}
```

### `POST /api/tasks`
- Body:
```json
{
  "title": "Build auth form",
  "description": "Use shadcn form fields",
  "status": "NEW",
  "workspaceId": "ws_1",
  "badgeNames": ["frontend", "auth"],
  "imageUrls": ["/uploads/a.png"]
}
```
- Response (201): created task payload.

### `PATCH /api/tasks/:id`
- Body supports partial updates for:
  - `title`
  - `description`
  - `status`
  - `workspaceId`
  - `badgeNames`
  - `imageUrls`

### `DELETE /api/tasks/:id`
- Response (200):
```json
{
  "ok": true
}
```

## Upload Endpoint

### `POST /api/uploads`
- Content type: `multipart/form-data`
- Field name: `files`
- Response:
```json
{
  "files": [
    {
      "url": "/uploads/unique-file-name.png",
      "fileName": "unique-file-name.png"
    }
  ]
}
```

## Revalidation Tags
- `board-data`
- `workspace-list`
- `task-list`
