"use client"

import { arrayMove } from "@dnd-kit/sortable"
import { useCallback, useMemo, useState } from "react"

import { TaskDetailsSheet } from "@/components/tasks/task-details-sheet"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnContent,
  KanbanItem,
  KanbanItemHandle,
  KanbanMoveEvent,
  KanbanOverlay,
} from "@/components/ui/kanban"
import { CreateTaskModal } from "@/components/workspaces/create-task-modal"
import { TaskStatusBadge } from "@/components/workspaces/task-status-badge"
import { updateTaskStatusAction } from "@/lib/server/tasks/actions"
import type { WorkspaceTask } from "@/lib/types/workspace"

type TaskStatus = WorkspaceTask["status"]

const COLUMN_ORDER = ["backlog", "new", "inprogress", "review", "done"] as const
type ColumnKey = (typeof COLUMN_ORDER)[number]
type ColumnState = Record<ColumnKey, WorkspaceTask[]>

const COLUMN_CONFIG: Record<ColumnKey, { status: TaskStatus }> = {
  backlog: { status: "BACKLOG" },
  new: { status: "NEW" },
  inprogress: { status: "IN_PROGRESS" },
  review: { status: "PREVIEW" },
  done: { status: "DONE" },
}

const STATUS_TO_COLUMN: Record<TaskStatus, ColumnKey> = {
  BACKLOG: "backlog",
  NEW: "new",
  IN_PROGRESS: "inprogress",
  PREVIEW: "review",
  DONE: "done",
}

function createEmptyColumns(): ColumnState {
  return {
    backlog: [],
    new: [],
    inprogress: [],
    review: [],
    done: [],
  }
}

function mapTasksToColumns(tasks: WorkspaceTask[]) {
  const nextColumns = createEmptyColumns()

  for (const task of tasks) {
    const key = STATUS_TO_COLUMN[task.status]
    nextColumns[key].push(task)
  }

  return nextColumns
}

function isColumnKey(value: string): value is ColumnKey {
  return COLUMN_ORDER.includes(value as ColumnKey)
}

function applyMove(columns: ColumnState, moveEvent: KanbanMoveEvent) {
  const from = moveEvent.activeContainer
  const to = moveEvent.overContainer

  if (!isColumnKey(from) || !isColumnKey(to)) {
    return {
      nextColumns: columns,
      movedTask: null as WorkspaceTask | null,
      from,
      to,
    }
  }

  if (from === to) {
    const items = columns[from]
    const nextItems = arrayMove(items, moveEvent.activeIndex, moveEvent.overIndex)
    const movedTask = nextItems[moveEvent.overIndex] ?? null

    return {
      nextColumns: {
        ...columns,
        [from]: nextItems,
      },
      movedTask,
      from,
      to,
    }
  }

  const sourceItems = [...columns[from]]
  const targetItems = [...columns[to]]
  const [movedTask] = sourceItems.splice(moveEvent.activeIndex, 1)

  if (!movedTask) {
    return { nextColumns: columns, movedTask: null, from, to }
  }

  const movedTaskWithStatus: WorkspaceTask = {
    ...movedTask,
    status: COLUMN_CONFIG[to].status,
  }

  const insertIndex = Math.max(0, Math.min(moveEvent.overIndex, targetItems.length))
  targetItems.splice(insertIndex, 0, movedTaskWithStatus)

  return {
    nextColumns: {
      ...columns,
      [from]: sourceItems,
      [to]: targetItems,
    },
    movedTask: movedTaskWithStatus,
    from,
    to,
  }
}

type WorkspaceKanbanProps = {
  workspaceId: string
  initialTasks: WorkspaceTask[]
}

export function WorkspaceKanban({ workspaceId, initialTasks }: WorkspaceKanbanProps) {
  const [columns, setColumns] = useState<ColumnState>(() =>
    mapTasksToColumns(initialTasks)
  )
  const [error, setError] = useState<string | null>(null)
  const [taskDetailsOpen, setTaskDetailsOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const totalTasks = useMemo(
    () => Object.values(columns).reduce((sum, tasks) => sum + tasks.length, 0),
    [columns]
  )

  const handleTaskCreated = useCallback((task: WorkspaceTask) => {
    setError(null)
    const column = STATUS_TO_COLUMN[task.status]

    setColumns((prev) => ({
      ...prev,
      [column]: [task, ...prev[column]],
    }))
  }, [])

  const handleTaskClick = useCallback((taskId: string) => {
    setSelectedTaskId(taskId)
    setTaskDetailsOpen(true)
  }, [])

  const handleTaskDetailsOpenChange = useCallback((open: boolean) => {
    setTaskDetailsOpen(open)

    if (!open) {
      setSelectedTaskId(null)
    }
  }, [])

  const handleTaskDeleted = useCallback((taskId: string) => {
    setColumns((prev) => ({
      backlog: prev.backlog.filter((task) => task.id !== taskId),
      new: prev.new.filter((task) => task.id !== taskId),
      inprogress: prev.inprogress.filter((task) => task.id !== taskId),
      review: prev.review.filter((task) => task.id !== taskId),
      done: prev.done.filter((task) => task.id !== taskId),
    }))
  }, [])

  const handleMove = useCallback(
    async (moveEvent: KanbanMoveEvent) => {
      const previousColumns = columns
      const moveResult = applyMove(previousColumns, moveEvent)
      setColumns(moveResult.nextColumns)

      if (!moveResult.movedTask) {
        return
      }

      if (!isColumnKey(moveResult.from) || !isColumnKey(moveResult.to)) {
        return
      }

      const previousStatus = COLUMN_CONFIG[moveResult.from].status
      const nextStatus = COLUMN_CONFIG[moveResult.to].status

      if (previousStatus === nextStatus) {
        return
      }

      try {
        const result = await updateTaskStatusAction({
          taskId: moveResult.movedTask.id,
          status: nextStatus,
        })

        if (!result.ok) {
          setColumns(previousColumns)
          setError(result.error)
          return
        }

        setError(null)
      } catch (moveError) {
        setColumns(previousColumns)
        console.error("Move task error:", moveError)
        setError("Failed to update task status")
      }
    },
    [columns]
  )

  return (
    <section className="flex h-full min-h-0 flex-col gap-4 overflow-hidden p-0.5">
      <Card className="gap-3 py-4">
        <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Workspace board</p>
            <p className="text-xs text-muted-foreground">
              {totalTasks.toString()} task(s) across 5 columns
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <CreateTaskModal
              workspaceId={workspaceId}
              initialStatus="NEW"
              triggerLabel="Create Task"
              onTaskCreated={handleTaskCreated}
            />
            <CreateTaskModal
              workspaceId={workspaceId}
              initialStatus="BACKLOG"
              triggerLabel="New Backlog"
              triggerVariant="outline"
              onTaskCreated={handleTaskCreated}
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Kanban
        className="flex min-h-0 flex-1 flex-col"
        value={columns}
        onValueChange={(value) => setColumns(value as ColumnState)}
        getItemValue={(item) => item.id}
        onMove={(event) => void handleMove(event)}
      >
        <KanbanBoard className="h-full min-h-0 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {COLUMN_ORDER.map((columnKey) => {
            const tasks = columns[columnKey]

            return (
              <KanbanColumn key={columnKey} value={columnKey} className="min-h-0">
                <Card className="h-full min-h-0 gap-0 py-0">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-border/70 py-3!">
                    <TaskStatusBadge
                      status={COLUMN_CONFIG[columnKey].status}
                      size="default"
                    />
                    <span className="rounded-md border border-border bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                      {tasks.length}
                    </span>
                  </CardHeader>

                  <CardContent className="flex min-h-0 flex-1 flex-col px-0">
                    <KanbanColumnContent
                      value={columnKey}
                      className="min-h-0 flex-1 gap-0 overflow-y-auto"
                    >
                      {tasks.map((task) => (
                        <KanbanItem key={task.id} value={task.id}>
                          <KanbanItemHandle className="w-full">
                            <button
                              type="button"
                              onClick={() => handleTaskClick(task.id)}
                              className="w-full border-b border-border/70 px-3 py-3 text-left hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                            >
                              <h3 className="text-sm font-medium">{task.title}</h3>
                              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                {task.description || "No description"}
                              </p>
                            </button>
                          </KanbanItemHandle>
                        </KanbanItem>
                      ))}
                    </KanbanColumnContent>
                  </CardContent>
                </Card>
              </KanbanColumn>
            )
          })}
        </KanbanBoard>

        <KanbanOverlay>
          {({ value }) => {
            const task = Object.values(columns)
              .flat()
              .find((item) => item.id === value)

            if (!task) {
              return null
            }

            return (
              <article className="w-64 border border-border bg-card px-3 py-3">
                <h3 className="text-sm font-medium">{task.title}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {task.description || "No description"}
                </p>
              </article>
            )
          }}
        </KanbanOverlay>
      </Kanban>

      <TaskDetailsSheet
        taskId={selectedTaskId}
        open={taskDetailsOpen}
        onOpenChange={handleTaskDetailsOpenChange}
        onTaskDeleted={handleTaskDeleted}
      />
    </section>
  )
}
