import path from "node:path"

import type { TaskFileTypeValue } from "@/lib/constants/files"

function getFileExtension(fileName: string) {
  return path.extname(fileName).toLowerCase()
}

export function sanitizeFileName(fileName: string) {
  const normalized = fileName.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "")
  return normalized.length > 0 ? normalized : "file"
}

export function buildStorageFileName(fileName: string, uniquePrefix: string) {
  const rawExtension = getFileExtension(fileName).replace(/[^a-z0-9.]/g, "")
  const extension = /^\.[a-z0-9]{1,12}$/.test(rawExtension) ? rawExtension : ""
  return `${uniquePrefix}${extension}`
}

export function detectTaskFileType({
  mimeType,
  fileName,
}: {
  mimeType: string
  fileName: string
}): TaskFileTypeValue {
  const mime = mimeType.toLowerCase()
  const extension = getFileExtension(fileName)

  if (mime.startsWith("image/")) {
    return "IMAGE"
  }

  if (mime === "application/pdf" || extension === ".pdf") {
    return "PDF"
  }

  if (
    mime.startsWith("text/") ||
    [".txt", ".md", ".json", ".csv", ".xml", ".yaml", ".yml", ".log"].includes(
      extension
    )
  ) {
    return "TEXT"
  }

  if (mime.startsWith("video/")) {
    return "VIDEO"
  }

  if (mime.startsWith("audio/")) {
    return "AUDIO"
  }

  if (
    [
      "application/zip",
      "application/x-rar-compressed",
      "application/x-7z-compressed",
      "application/gzip",
      "application/x-tar",
    ].includes(mime) ||
    [".zip", ".rar", ".7z", ".gz", ".tar"].includes(extension)
  ) {
    return "ARCHIVE"
  }

  return "OTHER"
}
