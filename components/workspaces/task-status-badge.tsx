import { Badge } from "@/components/ui/badge"
import type { TaskStatusValue } from "@/lib/validations/workspace-task"

const STATUS_BADGE_CONFIG: Record<
  TaskStatusValue,
  {
    label: string
    variant:
      | "secondary"
      | "info-light"
      | "warning-light"
      | "primary-light"
      | "success-light"
  }
> = {
  BACKLOG: {
    label: "Backlog",
    variant: "secondary",
  },
  NEW: {
    label: "New",
    variant: "info-light",
  },
  IN_PROGRESS: {
    label: "In Progress",
    variant: "warning-light",
  },
  PREVIEW: {
    label: "Review",
    variant: "primary-light",
  },
  DONE: {
    label: "Done",
    variant: "success-light",
  },
}

type TaskStatusBadgeProps = {
  status: TaskStatusValue
}

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  const config = STATUS_BADGE_CONFIG[status]

  return (
    <Badge variant={config.variant} size="sm" radius="full">
      {config.label}
    </Badge>
  )
}
