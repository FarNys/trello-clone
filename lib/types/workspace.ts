import type { TaskStatusValue } from "@/lib/validations/workspace-task"

export type WorkspaceListItem = {
  id: string
  name: string
  description?: string | null
  _count?: {
    tasks?: number
  }
}

export type WorkspaceTask = {
  id: string
  title: string
  description?: string | null
  status: TaskStatusValue
}

export type TaskActivityTypeValue =
  | "CREATED"
  | "ASSIGNED"
  | "UNASSIGNED"
  | "STATUS_CHANGED"
  | "DELETED"
  | "RESTORED"

export type WorkspaceTaskActivity = {
  id: string
  type: TaskActivityTypeValue
  fromStatus?: TaskStatusValue | null
  toStatus?: TaskStatusValue | null
  createdAt: string
  actor?: {
    id: string
    name: string
  } | null
}

export type WorkspaceTaskDetails = WorkspaceTask & {
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
  activities: WorkspaceTaskActivity[]
}
