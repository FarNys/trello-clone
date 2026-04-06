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
