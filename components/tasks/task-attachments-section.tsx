"use client"

import Image from "next/image"
import { type ChangeEvent, useMemo, useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  MAX_TASK_FILES_PER_TASK,
  TASK_FILE_TYPE_LABELS,
} from "@/lib/constants/files"
import { addTaskFilesAction } from "@/lib/server/tasks/actions"
import type { WorkspaceTaskFile } from "@/lib/types/workspace"
import type { TaskFileCreateInput } from "@/lib/validations/workspace-task"

type TaskAttachmentsSectionProps = {
  taskId: string
  files: WorkspaceTaskFile[]
  onFilesUpdated: () => Promise<void> | void
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

function isVideoOrAudio(file: WorkspaceTaskFile) {
  return file.fileType === "VIDEO" || file.fileType === "AUDIO"
}

function isDownloadableFile(file: WorkspaceTaskFile) {
  return !isVideoOrAudio(file) && file.fileType !== "IMAGE"
}

export function TaskAttachmentsSection({
  taskId,
  files,
  onFilesUpdated,
}: TaskAttachmentsSectionProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [fileInputKey, setFileInputKey] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<WorkspaceTaskFile | null>(
    null
  )
  const [isSaving, startSaving] = useTransition()

  const remainingSlots = Math.max(0, MAX_TASK_FILES_PER_TASK - files.length)

  const canUpload = useMemo(
    () => selectedFiles.length > 0 && selectedFiles.length <= remainingSlots,
    [remainingSlots, selectedFiles.length]
  )

  function handleFilesChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFiles = Array.from(event.target.files ?? [])
    const merged = [...selectedFiles, ...nextFiles]
    const deduped = merged.filter((file, index, arr) => {
      return (
        arr.findIndex(
          (candidate) =>
            candidate.name === file.name &&
            candidate.size === file.size &&
            candidate.lastModified === file.lastModified
        ) === index
      )
    })

    if (deduped.length > remainingSlots) {
      setSelectedFiles(deduped.slice(0, remainingSlots))
      setError(`You can add up to ${remainingSlots} more file(s).`)
      setFileInputKey((prev) => prev + 1)
      return
    }

    setSelectedFiles(deduped)
    setError(null)
    setFileInputKey((prev) => prev + 1)
  }

  function handleRemoveSelectedFile(fileToRemove: File) {
    setSelectedFiles((current) =>
      current.filter(
        (file) =>
          !(
            file.name === fileToRemove.name &&
            file.size === fileToRemove.size &&
            file.lastModified === fileToRemove.lastModified
          )
      )
    )
  }

  async function uploadSelectedFiles() {
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

  function handleAddFiles() {
    setError(null)

    if (!canUpload) {
      setError("No files selected or max files reached.")
      return
    }

    startSaving(async () => {
      try {
        const uploadedFiles = await uploadSelectedFiles()
        const result = await addTaskFilesAction({
          taskId,
          files: uploadedFiles,
        })

        if (!result.ok) {
          setError(result.error)
          return
        }

        setSelectedFiles([])
        setFileInputKey((prev) => prev + 1)
        await onFilesUpdated()
      } catch (uploadError) {
        console.error("Add task files error:", uploadError)
        setError(
          uploadError instanceof Error
            ? uploadError.message
            : "Failed to add files"
        )
      }
    })
  }

  return (
    <section className="space-y-3 border-b border-border/70 pb-4">
      <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Files
      </h3>

      <div className="space-y-2">
        <Label htmlFor="task-details-files">Add attachments</Label>
        <Input
          key={fileInputKey}
          id="task-details-files"
          type="file"
          multiple
          onChange={handleFilesChange}
          disabled={remainingSlots === 0 || isSaving}
        />
        <p className="text-xs text-muted-foreground">
          Total limit is {MAX_TASK_FILES_PER_TASK} files per task. Remaining:{" "}
          {remainingSlots}
        </p>

        {selectedFiles.length > 0 && (
          <ul className="space-y-1">
            {selectedFiles.map((file) => (
              <li
                key={`${file.name}-${file.size}-${file.lastModified}`}
                className="flex items-center justify-between gap-2 rounded-md border border-border/70 bg-muted/20 px-2 py-1.5 text-xs"
              >
                <div className="min-w-0">
                  <p className="truncate text-foreground">{file.name}</p>
                  <p className="text-muted-foreground">
                    {formatBytes(file.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  onClick={() => handleRemoveSelectedFile(file)}
                  disabled={isSaving}
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}

        <Button
          type="button"
          size="sm"
          onClick={handleAddFiles}
          disabled={!canUpload || isSaving}
        >
          {isSaving ? "Adding..." : "Add files"}
        </Button>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {files.length === 0 ? (
        <p className="text-sm text-muted-foreground">No files attached.</p>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <article
              key={file.id}
              className="rounded-md border border-border/70 bg-muted/20 p-3"
            >
              {file.fileType === "IMAGE" && (
                <div className="space-y-2">
                  <img
                    src={file.url}
                    alt={file.originalName}
                    width={960}
                    height={540}
                    className="max-h-48 w-full rounded-md border border-border/60 object-cover"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewImage(file)}
                  >
                    Fullscreen
                  </Button>
                </div>
              )}

              {file.fileType === "VIDEO" && (
                <video
                  src={file.url}
                  controls
                  className="mb-3 max-h-64 w-full rounded-md border border-border/60 bg-black"
                />
              )}

              {file.fileType === "AUDIO" && (
                <audio src={file.url} controls className="mb-3 w-full" />
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

                <div className="flex items-center gap-2">
                  {isDownloadableFile(file) && (
                    <Button asChild size="sm" variant="outline">
                      <a href={file.url} download={file.originalName}>
                        Download
                      </a>
                    </Button>
                  )}
                  <Button asChild size="sm" variant="outline">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open
                    </a>
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog
        open={Boolean(previewImage)}
        onOpenChange={() => setPreviewImage(null)}
      >
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>
              {previewImage?.originalName ?? "Image preview"}
            </DialogTitle>
          </DialogHeader>
          {previewImage && (
            <img
              src={previewImage.url}
              alt={previewImage.originalName}
              width={1600}
              height={900}
              className="max-h-[75vh] w-full rounded-md object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
