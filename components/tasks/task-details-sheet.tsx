"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import {
  Delete02Icon,
  RestoreBinIcon,
} from "@hugeicons/core-free-icons"
import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { TaskActivityLogs } from "@/components/workspaces/task-activity-logs"
import { TaskStatusBadge } from "@/components/workspaces/task-status-badge"
import {
  getTaskDetailsAction,
  restoreTaskAction,
  softDeleteTaskAction,
} from "@/lib/server/tasks/actions"
import { TASK_FILE_TYPE_LABELS } from "@/lib/constants/files"
import type { WorkspaceTaskDetails } from "@/lib/types/workspace"

type TaskDetailsSheetProps = {
  taskId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskDeleted?: (taskId: string) => void
  onTaskRestored?: (taskId: string) => void
}

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
})

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  const units = ["KB", "MB", "GB"]
  let value = bytes / 1024
  let unitIndex = 0

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  return `${value.toFixed(1)} ${units[unitIndex]}`
}

export function TaskDetailsSheet({
  taskId,
  open,
  onOpenChange,
  onTaskDeleted,
  onTaskRestored,
}: TaskDetailsSheetProps) {
  const [taskDetails, setTaskDetails] = useState<WorkspaceTaskDetails | null>(null)
  const [loadingTaskDetails, setLoadingTaskDetails] = useState(false)
  const [taskDetailsError, setTaskDetailsError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const requestRef = useRef(0)

  const loadTaskDetails = useCallback(async (nextTaskId: string) => {
    setLoadingTaskDetails(true)
    setTaskDetailsError(null)

    const requestId = requestRef.current + 1
    requestRef.current = requestId

    try {
      const result = await getTaskDetailsAction({ taskId: nextTaskId })

      if (requestRef.current !== requestId) {
        return
      }

      if (!result.ok) {
        setTaskDetails(null)
        setTaskDetailsError(result.error)
        return
      }

      setTaskDetails(result.data.task)
    } catch (error) {
      console.error("Load task details error:", error)

      if (requestRef.current !== requestId) {
        return
      }

      setTaskDetails(null)
      setTaskDetailsError("Failed to load task details")
    } finally {
      if (requestRef.current === requestId) {
        setLoadingTaskDetails(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!open || !taskId) {
      return
    }

    void loadTaskDetails(taskId)
  }, [loadTaskDetails, open, taskId])

  useEffect(() => {
    if (!open) {
      setTaskDetails(null)
      setTaskDetailsError(null)
      setLoadingTaskDetails(false)
      setIsSubmitting(false)
    }
  }, [open])

  const handleSoftDelete = useCallback(async () => {
    if (!taskId) {
      return
    }

    setIsSubmitting(true)
    setTaskDetailsError(null)

    try {
      const result = await softDeleteTaskAction({ taskId })

      if (!result.ok) {
        setTaskDetailsError(result.error)
        return
      }

      onTaskDeleted?.(taskId)
      onOpenChange(false)
    } catch (error) {
      console.error("Soft delete task error:", error)
      setTaskDetailsError("Failed to delete task")
    } finally {
      setIsSubmitting(false)
    }
  }, [onOpenChange, onTaskDeleted, taskId])

  const handleRestore = useCallback(async () => {
    if (!taskId) {
      return
    }

    setIsSubmitting(true)
    setTaskDetailsError(null)

    try {
      const result = await restoreTaskAction({ taskId })

      if (!result.ok) {
        setTaskDetailsError(result.error)
        return
      }

      onTaskRestored?.(taskId)
      onOpenChange(false)
    } catch (error) {
      console.error("Restore task error:", error)
      setTaskDetailsError("Failed to restore task")
    } finally {
      setIsSubmitting(false)
    }
  }, [onOpenChange, onTaskRestored, taskId])

  const showRestore = Boolean(taskDetails?.deletedAt)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-2xl">
        <div className="flex h-full min-h-0 flex-col">
          <SheetHeader className="border-b border-border/70 pr-14">
            <div className="flex flex-wrap items-center gap-2">
              <SheetTitle>
                {taskDetails?.title ?? (taskId ? "Task details" : "Task")}
              </SheetTitle>
              {taskDetails && <TaskStatusBadge status={taskDetails.status} size="default" />}
            </div>
            <SheetDescription>
              Task info and activity history in timeline view.
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4">
            {loadingTaskDetails && (
              <p className="text-sm text-muted-foreground">Loading task details...</p>
            )}

            {!loadingTaskDetails && taskDetailsError && (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {taskDetailsError}
              </p>
            )}

            {!loadingTaskDetails && !taskDetailsError && taskDetails && (
              <>
                <div className="flex flex-wrap gap-2">
                  {showRestore ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void handleRestore()}
                      disabled={isSubmitting}
                    >
                      <HugeiconsIcon icon={RestoreBinIcon} strokeWidth={2} />
                      {isSubmitting ? "Restoring..." : "Restore Task"}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => void handleSoftDelete()}
                      disabled={isSubmitting}
                    >
                      <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                      {isSubmitting ? "Deleting..." : "Delete Task"}
                    </Button>
                  )}
                </div>

                <section className="space-y-2 border-b border-border/70 pb-4">
                  <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Description
                  </h3>
                  <p className="text-sm text-foreground">
                    {taskDetails.description || "No description"}
                  </p>
                </section>

                <section className="space-y-3 border-b border-border/70 pb-4">
                  <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Files
                  </h3>
                  {taskDetails.files.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No files attached.</p>
                  ) : (
                    <div className="space-y-2">
                      {taskDetails.files.map((file) => (
                        <article
                          key={file.id}
                          className="rounded-md border border-border/70 bg-muted/20 p-3"
                        >
                          {file.fileType === "IMAGE" && (
                            <Image
                              src={file.url}
                              alt={file.originalName}
                              width={960}
                              height={540}
                              className="mb-3 max-h-48 w-full rounded-md border border-border/60 object-contain"
                            />
                          )}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="space-y-1">
                              <p className="text-sm font-medium">{file.originalName}</p>
                              <p className="text-xs text-muted-foreground">
                                {TASK_FILE_TYPE_LABELS[file.fileType]} •{" "}
                                {formatBytes(file.sizeBytes)} •{" "}
                                {DATE_FORMATTER.format(new Date(file.createdAt))}
                              </p>
                              {file.uploader && (
                                <p className="text-xs text-muted-foreground">
                                  Uploaded by {file.uploader.name}
                                </p>
                              )}
                            </div>

                            <Button asChild size="sm" variant="outline">
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Open file
                              </a>
                            </Button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>

                <TaskActivityLogs activities={taskDetails.activities} />
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
