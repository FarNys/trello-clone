"use client"

import { type ChangeEvent, type FormEvent, useState } from "react"

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
import { MAX_TASK_FILES_PER_TASK } from "@/lib/constants/files"
import { createTaskAction } from "@/lib/server/tasks/actions"
import type { WorkspaceTask } from "@/lib/types/workspace"
import type {
  TaskFileCreateInput,
  TaskStatusValue,
} from "@/lib/validations/workspace-task"

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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [fileInputKey, setFileInputKey] = useState(0)

  function clearSelectedFiles() {
    setSelectedFiles([])
    setFileInputKey((prev) => prev + 1)
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)

    if (!nextOpen) {
      return
    }

    setTitle("")
    setDescription("")
    setStatus(initialStatus)
    clearSelectedFiles()
    setError(null)
  }

  function handleFilesChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])

    if (files.length > MAX_TASK_FILES_PER_TASK) {
      setError(`You can upload up to ${MAX_TASK_FILES_PER_TASK} files per task.`)
      setSelectedFiles(files.slice(0, MAX_TASK_FILES_PER_TASK))
      return
    }

    setSelectedFiles(files)
    setError(null)
  }

  async function uploadSelectedFiles() {
    if (selectedFiles.length === 0) {
      return [] as TaskFileCreateInput[]
    }

    const formData = new FormData()
    for (const file of selectedFiles) {
      formData.append("files", file)
    }

    const response = await fetch("/api/uploads", {
      method: "POST",
      body: formData,
    })

    const payload = (await response.json()) as {
      files?: TaskFileCreateInput[]
      error?: string
    }

    if (!response.ok) {
      throw new Error(payload.error ?? "Failed to upload files")
    }

    return payload.files ?? []
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

    if (selectedFiles.length > MAX_TASK_FILES_PER_TASK) {
      setError(`You can upload up to ${MAX_TASK_FILES_PER_TASK} files per task.`)
      return
    }

    setIsSubmitting(true)

    try {
      const uploadedFiles = await uploadSelectedFiles()
      const result = await createTaskAction({
        workspaceId,
        title: trimmedTitle,
        description: trimmedDescription.length > 0 ? trimmedDescription : undefined,
        status,
        files: uploadedFiles,
      })

      if (!result.ok) {
        setError(result.error)
        return
      }

      onTaskCreated?.(result.data.task)
      setOpen(false)
    } catch (submitError) {
      console.error("Create task modal submit error:", submitError)
      setError(
        submitError instanceof Error ? submitError.message : "Failed to create task"
      )
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

          <div className="space-y-2">
            <Label htmlFor="task-files">Attachments</Label>
            <Input
              key={fileInputKey}
              id="task-files"
              type="file"
              multiple
              onChange={handleFilesChange}
            />
            <p className="text-xs text-muted-foreground">
              Upload up to {MAX_TASK_FILES_PER_TASK} files (image, text, PDF, and
              more).
            </p>
            {selectedFiles.length > 0 && (
              <div className="rounded-md border border-border/70 bg-muted/30 px-3 py-2">
                <p className="text-xs font-medium">
                  Selected {selectedFiles.length}/{MAX_TASK_FILES_PER_TASK}
                </p>
                <ul className="mt-1 space-y-1">
                  {selectedFiles.map((file) => (
                    <li key={`${file.name}-${file.size}`} className="text-xs text-muted-foreground">
                      {file.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
