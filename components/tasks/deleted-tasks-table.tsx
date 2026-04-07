"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import {
  RestoreBinIcon,
  ViewIcon,
} from "@hugeicons/core-free-icons"
import { useMemo, useState } from "react"

import { TaskDetailsSheet } from "@/components/tasks/task-details-sheet"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TaskStatusBadge } from "@/components/workspaces/task-status-badge"
import { restoreTaskAction } from "@/lib/server/tasks/actions"
import type { DeletedTaskTableItem } from "@/lib/server/tasks/queries"

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
})

function formatDeletedAt(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "Unknown"
  }

  return DATE_FORMATTER.format(date)
}

type DeletedTasksTableProps = {
  tasks: DeletedTaskTableItem[]
}

export function DeletedTasksTable({ tasks }: DeletedTasksTableProps) {
  const [rows, setRows] = useState(tasks)
  const [submittingTaskId, setSubmittingTaskId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [taskDetailsOpen, setTaskDetailsOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const hasRows = useMemo(() => rows.length > 0, [rows.length])

  async function handleRestore(taskId: string) {
    setSubmittingTaskId(taskId)
    setError(null)

    try {
      const result = await restoreTaskAction({ taskId })

      if (!result.ok) {
        setError(result.error)
        return
      }

      setRows((prev) => prev.filter((task) => task.id !== taskId))
    } catch (restoreError) {
      console.error("Restore task from table error:", restoreError)
      setError("Failed to restore task")
    } finally {
      setSubmittingTaskId(null)
    }
  }

  function handleOpenLogs(taskId: string) {
    setSelectedTaskId(taskId)
    setTaskDetailsOpen(true)
  }

  function handleSheetOpenChange(open: boolean) {
    setTaskDetailsOpen(open)

    if (!open) {
      setSelectedTaskId(null)
    }
  }

  function handleSheetTaskRestored(taskId: string) {
    setRows((prev) => prev.filter((task) => task.id !== taskId))
  }

  if (!hasRows) {
    return (
      <div className="space-y-3">
        {error && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          No deleted tasks found.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Workspace</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Deleted At</TableHead>
            <TableHead className="w-32 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.map((task) => (
            <TableRow key={task.id}>
              <TableCell className="font-medium">{task.title}</TableCell>
              <TableCell className="text-muted-foreground">
                {task.workspace.name}
              </TableCell>
              <TableCell>
                <TaskStatusBadge status={task.status} size="sm" />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDeletedAt(task.deletedAt)}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => handleOpenLogs(task.id)}
                    title="View task logs"
                    aria-label="View task logs"
                  >
                    <HugeiconsIcon icon={ViewIcon} strokeWidth={2} />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="outline"
                    onClick={() => void handleRestore(task.id)}
                    disabled={submittingTaskId === task.id}
                    title="Restore task"
                    aria-label="Restore task"
                  >
                    <HugeiconsIcon icon={RestoreBinIcon} strokeWidth={2} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <TaskDetailsSheet
        taskId={selectedTaskId}
        open={taskDetailsOpen}
        onOpenChange={handleSheetOpenChange}
        onTaskRestored={handleSheetTaskRestored}
      />
    </div>
  )
}
