"use client"

import { arrayMove } from "@dnd-kit/sortable"
import { useCallback, useMemo, useState } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreateTaskModal } from "@/components/workspaces/create-task-modal"
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
import { fetchWrapper, isFetchWrapperError } from "@/lib/fetch-wrapper"
import type { WorkspaceTask } from "@/lib/types/workspace"
import { cn } from "@/lib/utils"

type TaskStatus = WorkspaceTask["status"]

const COLUMN_ORDER = ["backlog", "new", "inprogress", "review", "done"] as const
type ColumnKey = (typeof COLUMN_ORDER)[number]
type ColumnState = Record<ColumnKey, WorkspaceTask[]>

const COLUMN_CONFIG: Record<ColumnKey, { title: string; status: TaskStatus }> = {
  backlog: { title: "Backlog", status: "BACKLOG" },
  new: { title: "New", status: "NEW" },
  inprogress: { title: "In Progress", status: "IN_PROGRESS" },
  review: { title: "Review", status: "PREVIEW" },
  done: { title: "Done", status: "DONE" },
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

  const insertIndex = Math.max(0, Math.min(moveEvent.overIndex, targetItems.length))
  targetItems.splice(insertIndex, 0, movedTask)

  return {
    nextColumns: {
      ...columns,
      [from]: sourceItems,
      [to]: targetItems,
    },
    movedTask,
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
        await fetchWrapper(`/api/tasks/${moveResult.movedTask.id}`, {
          method: "PATCH",
          body: {
            status: nextStatus,
          },
        })
      } catch (moveError) {
        setColumns(previousColumns)

        if (isFetchWrapperError(moveError)) {
          setError(moveError.message)
        } else {
          setError("Failed to update task status")
        }
      }
    },
    [columns]
  )

  return (
    <section className="space-y-4">
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
        value={columns}
        onValueChange={(value) => setColumns(value as ColumnState)}
        getItemValue={(item) => item.id}
        onMove={(event) => void handleMove(event)}
      >
        <KanbanBoard className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-5">
          {COLUMN_ORDER.map((columnKey) => {
            const tasks = columns[columnKey]

            return (
              <KanbanColumn key={columnKey} value={columnKey}>
                <Card className="h-full gap-3 py-4">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-semibold">
                      {COLUMN_CONFIG[columnKey].title}
                    </CardTitle>
                    <span className="rounded-md border border-border bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                      {tasks.length}
                    </span>
                  </CardHeader>

                  <CardContent>
                    <KanbanColumnContent value={columnKey} className="min-h-20 gap-2">
                      {tasks.map((task) => (
                        <KanbanItem key={task.id} value={task.id}>
                          <KanbanItemHandle className="w-full">
                            <article className="rounded-lg border border-border bg-card p-3 shadow-xs">
                              <h3 className="text-sm font-medium">{task.title}</h3>
                              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                {task.description || "No description"}
                              </p>
                            </article>
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
              <article
                className={cn(
                  "w-64 rounded-lg border border-border bg-card p-3 shadow-lg"
                )}
              >
                <h3 className="text-sm font-medium">{task.title}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {task.description || "No description"}
                </p>
              </article>
            )
          }}
        </KanbanOverlay>
      </Kanban>
    </section>
  )
}
