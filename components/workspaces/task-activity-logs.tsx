"use client"

import type { ReactNode } from "react"

import {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from "@/components/ui/timeline"
import { TaskStatusBadge } from "@/components/workspaces/task-status-badge"
import type { WorkspaceTaskActivity } from "@/lib/types/workspace"

const TIMELINE_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
})

function formatTimelineDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "Unknown time"
  }

  return TIMELINE_DATE_FORMATTER.format(date)
}

function getActivityTitle(activity: WorkspaceTaskActivity) {
  switch (activity.type) {
    case "CREATED":
      return "Task Created"
    case "STATUS_CHANGED":
      return "Status Changed"
    case "DELETED":
      return "Task Deleted"
    case "RESTORED":
      return "Task Restored"
    case "ASSIGNED":
      return "Task Assigned"
    case "UNASSIGNED":
      return "Task Unassigned"
    default:
      return "Task Updated"
  }
}

function renderActivityDescription(activity: WorkspaceTaskActivity): ReactNode {
  const actorName = activity.actor?.name ?? "System"

  if (activity.type === "STATUS_CHANGED" && activity.fromStatus && activity.toStatus) {
    return (
      <span className="inline-flex flex-wrap items-center gap-1.5">
        <span>{actorName} moved this task from</span>
        <TaskStatusBadge status={activity.fromStatus} size="sm" />
        <span>to</span>
        <TaskStatusBadge status={activity.toStatus} size="sm" />
        <span>.</span>
      </span>
    )
  }

  if (activity.type === "CREATED" && activity.toStatus) {
    return (
      <span className="inline-flex flex-wrap items-center gap-1.5">
        <span>{actorName} created this task in</span>
        <TaskStatusBadge status={activity.toStatus} size="sm" />
        <span>.</span>
      </span>
    )
  }

  if (activity.type === "ASSIGNED") {
    return `${actorName} assigned this task.`
  }

  if (activity.type === "UNASSIGNED") {
    return `${actorName} removed assignee from this task.`
  }

  if (activity.type === "DELETED") {
    return activity.fromStatus ? (
      <span className="inline-flex flex-wrap items-center gap-1.5">
        <span>{actorName} deleted this task from</span>
        <TaskStatusBadge status={activity.fromStatus} size="sm" />
        <span>.</span>
      </span>
    ) : (
      `${actorName} deleted this task.`
    )
  }

  if (activity.type === "RESTORED") {
    return activity.toStatus ? (
      <span className="inline-flex flex-wrap items-center gap-1.5">
        <span>{actorName} restored this task to</span>
        <TaskStatusBadge status={activity.toStatus} size="sm" />
        <span>.</span>
      </span>
    ) : (
      `${actorName} restored this task.`
    )
  }

  return `${actorName} updated this task.`
}

type TaskActivityLogsProps = {
  activities: WorkspaceTaskActivity[]
}

export function TaskActivityLogs({ activities }: TaskActivityLogsProps) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">Activity Timeline</h3>

      {activities.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activity has been logged yet.</p>
      ) : (
        <Timeline defaultValue={activities.length} className="gap-0">
          {activities.map((activity, index) => (
            <TimelineItem
              key={activity.id}
              step={activities.length - index}
              className="pb-5"
            >
              <TimelineIndicator className="bg-background" />
              <TimelineSeparator />
              <TimelineHeader className="space-y-0.5">
                <TimelineTitle>{getActivityTitle(activity)}</TimelineTitle>
                <TimelineDate>{formatTimelineDate(activity.createdAt)}</TimelineDate>
              </TimelineHeader>
              <TimelineContent>{renderActivityDescription(activity)}</TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      )}
    </section>
  )
}
