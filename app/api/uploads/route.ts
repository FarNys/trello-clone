import { randomUUID } from "node:crypto"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { NextResponse } from "next/server"

import {
  MAX_TASK_FILE_SIZE_BYTES,
  MAX_TASK_FILES_PER_TASK,
} from "@/lib/constants/files"
import { getAuthUserIdFromCookie } from "@/lib/auth"
import {
  buildStorageFileName,
  detectTaskFileType,
  sanitizeFileName,
} from "@/lib/server/files/upload-utils"

export const runtime = "nodejs"

const TASK_UPLOADS_DIRECTORY = path.join(process.cwd(), "public", "uploads", "tasks")

export async function POST(request: Request) {
  const userId = await getAuthUserIdFromCookie()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await request.formData()
  const files = formData
    .getAll("files")
    .filter(
      (value): value is File => value instanceof File && value.size > 0
    )

  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 })
  }

  if (files.length > MAX_TASK_FILES_PER_TASK) {
    return NextResponse.json(
      {
        error: `You can upload up to ${MAX_TASK_FILES_PER_TASK} files per task.`,
      },
      { status: 400 }
    )
  }

  const tooLargeFile = files.find((file) => file.size > MAX_TASK_FILE_SIZE_BYTES)
  if (tooLargeFile) {
    return NextResponse.json(
      {
        error: `File "${tooLargeFile.name}" exceeds ${(MAX_TASK_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(0)} MB limit.`,
      },
      { status: 400 }
    )
  }

  await mkdir(TASK_UPLOADS_DIRECTORY, { recursive: true })

  try {
    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        const safeOriginalName = sanitizeFileName(file.name)
        const storageName = buildStorageFileName(
          safeOriginalName,
          `${Date.now()}-${randomUUID()}`
        )
        const destination = path.join(TASK_UPLOADS_DIRECTORY, storageName)
        const arrayBuffer = await file.arrayBuffer()
        await writeFile(destination, Buffer.from(arrayBuffer))

        const mimeType =
          file.type.trim().length > 0 ? file.type : "application/octet-stream"

        return {
          originalName: safeOriginalName,
          storageName,
          url: `/uploads/tasks/${storageName}`,
          mimeType,
          fileType: detectTaskFileType({
            mimeType,
            fileName: safeOriginalName,
          }),
          sizeBytes: file.size,
        }
      })
    )

    return NextResponse.json({ files: uploadedFiles }, { status: 201 })
  } catch (error) {
    console.error("Task file upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload files" },
      { status: 500 }
    )
  }
}
