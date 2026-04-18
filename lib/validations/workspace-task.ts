import { z } from "zod"
import {
  MAX_TASK_FILE_SIZE_BYTES,
  MAX_TASK_FILES_PER_TASK,
  taskFileTypeValues,
} from "@/lib/constants/files"

export const taskStatusValues = [
  "BACKLOG",
  "NEW",
  "IN_PROGRESS",
  "PREVIEW",
  "DONE",
] as const

export type TaskStatusValue = (typeof taskStatusValues)[number]

export const taskFileCreateSchema = z.object({
  originalName: z.string().trim().min(1).max(255),
  storageName: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .regex(/^[a-zA-Z0-9._-]+$/),
  url: z.string().trim().startsWith("/uploads/tasks/"),
  mimeType: z.string().trim().min(1).max(200),
  fileType: z.enum(taskFileTypeValues),
  sizeBytes: z.number().int().min(1).max(MAX_TASK_FILE_SIZE_BYTES),
})

export type TaskFileCreateInput = z.infer<typeof taskFileCreateSchema>

export const workspaceCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional(),
})

export const taskCreateSchema = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(2000).optional(),
  status: z.enum(taskStatusValues).optional(),
  assigneeId: z.string().trim().min(1).optional(),
  files: z.array(taskFileCreateSchema).max(MAX_TASK_FILES_PER_TASK).optional(),
})

export const taskUpdateSchema = z
  .object({
    title: z.string().trim().min(2).max(200).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    status: z.enum(taskStatusValues).optional(),
    assigneeId: z.string().trim().min(1).nullable().optional(),
  })
  .refine(
    (value) =>
      value.title !== undefined ||
      value.description !== undefined ||
      value.status !== undefined ||
      value.assigneeId !== undefined,
    {
      message: "At least one field must be provided",
      path: ["_root"],
    }
  )

export const taskQuerySchema = z.object({
  workspaceId: z.string().trim().min(1).optional(),
  userId: z.string().trim().min(1).optional(),
  assigneeId: z.string().trim().min(1).optional(),
  creatorId: z.string().trim().min(1).optional(),
  status: z.enum(taskStatusValues).optional(),
})
