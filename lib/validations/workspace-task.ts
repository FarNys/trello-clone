import { z } from "zod"

export const taskStatusValues = [
  "BACKLOG",
  "NEW",
  "IN_PROGRESS",
  "PREVIEW",
  "DONE",
] as const

export type TaskStatusValue = (typeof taskStatusValues)[number]

export const workspaceCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional(),
})

export const taskCreateSchema = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(2000).optional(),
  status: z.enum(taskStatusValues).optional(),
  assigneeId: z.string().trim().min(1).optional(),
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
