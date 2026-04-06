"use client"

import { type FormEvent, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { fetchWrapper, isFetchWrapperError } from "@/lib/fetch-wrapper"
import type { WorkspaceTask } from "@/lib/types/workspace"
import type { TaskStatusValue } from "@/lib/validations/workspace-task"

type CreateTaskResponse = {
  task: WorkspaceTask
}

type CreateTaskModalProps = {
  workspaceId: string
  initialStatus: TaskStatusValue
  triggerLabel: string
  triggerVariant?: React.ComponentProps<typeof Button>["variant"]
  onTaskCreated?: (task: WorkspaceTask) => void
}

const STATUS_OPTIONS: Array<{ value: TaskStatusValue; label: string }> = [
  { value: "BACKLOG", label: "Backlog" },
  { value: "NEW", label: "New" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "PREVIEW", label: "Review" },
  { value: "DONE", label: "Done" },
]

export function CreateTaskModal({
  workspaceId,
  initialStatus,
  triggerLabel,
  triggerVariant = "default",
  onTaskCreated,
}: CreateTaskModalProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<TaskStatusValue>(initialStatus)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)

    if (!nextOpen) {
      return
    }

    setTitle("")
    setDescription("")
    setStatus(initialStatus)
    setError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const trimmedTitle = title.trim()
    const trimmedDescription = description.trim()

    if (trimmedTitle.length < 2) {
      setError("Title must be at least 2 characters.")
      return
    }

    setIsSubmitting(true)

    try {
      const payload = await fetchWrapper<CreateTaskResponse>(
        `/api/workspaces/${workspaceId}/tasks`,
        {
          method: "POST",
          body: {
            title: trimmedTitle,
            description: trimmedDescription.length > 0 ? trimmedDescription : undefined,
            status,
          },
        }
      )

      onTaskCreated?.(payload.task)
      setOpen(false)
    } catch (submitError) {
      if (isFetchWrapperError(submitError)) {
        setError(submitError.message)
      } else {
        setError("Failed to create task")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant={triggerVariant}>
          {triggerLabel}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create task</DialogTitle>
          <DialogDescription>
            Add a task to the board and choose its initial status.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              minLength={2}
              maxLength={200}
              placeholder="Write task title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={2000}
              placeholder="Optional details"
            />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as TaskStatusValue)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
