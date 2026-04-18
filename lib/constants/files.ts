export const MAX_TASK_FILES_PER_TASK = 3
export const MAX_TASK_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

export const taskFileTypeValues = [
  "IMAGE",
  "PDF",
  "TEXT",
  "VIDEO",
  "AUDIO",
  "ARCHIVE",
  "OTHER",
] as const

export type TaskFileTypeValue = (typeof taskFileTypeValues)[number]

export const TASK_FILE_TYPE_LABELS: Record<TaskFileTypeValue, string> = {
  IMAGE: "Image",
  PDF: "PDF",
  TEXT: "Text",
  VIDEO: "Video",
  AUDIO: "Audio",
  ARCHIVE: "Archive",
  OTHER: "Other",
}
