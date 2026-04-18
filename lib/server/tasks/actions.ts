"use server"

import { revalidatePath } from "next/cache"

import { getAuthUserIdFromCookie } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { ActionResult } from "@/lib/server/action-result"
import type {
  WorkspaceTask,
  WorkspaceTaskActivity,
  WorkspaceTaskFile,
  WorkspaceTaskDetails,
} from "@/lib/types/workspace"
import {
  type TaskFileCreateInput,
  type TaskStatusValue,
  taskCreateSchema,
  taskUpdateSchema,
} from "@/lib/validations/workspace-task"

type CreateTaskInput = {
  workspaceId: string
  title: string
  description?: string
  status: TaskStatusValue
  files?: TaskFileCreateInput[]
}

type CreateTaskPayload = {
  task: WorkspaceTask
}

type UpdateTaskStatusInput = {
  taskId: string
  status: TaskStatusValue
}

type UpdateTaskStatusPayload = {
  task: WorkspaceTask
  activity?: WorkspaceTaskActivity
}

type SoftDeleteTaskInput = {
  taskId: string
}

type SoftDeleteTaskPayload = {
  task: {
    id: string
    workspaceId: string
    deletedAt: string
  }
  activity: WorkspaceTaskActivity
}

type RestoreTaskInput = {
  taskId: string
}

type RestoreTaskPayload = {
  task: {
    id: string
    workspaceId: string
  }
  activity: WorkspaceTaskActivity
}

type GetTaskDetailsInput = {
  taskId: string
}

type GetTaskDetailsPayload = {
  task: WorkspaceTaskDetails
}

function mapTaskActivityToPayload(activity: {
  id: string
  type:
    | "CREATED"
    | "ASSIGNED"
    | "UNASSIGNED"
    | "STATUS_CHANGED"
    | "DELETED"
    | "RESTORED"
  fromStatus: TaskStatusValue | null
  toStatus: TaskStatusValue | null
  createdAt: Date
  actor: {
    id: string
    name: string
  } | null
}): WorkspaceTaskActivity {
  return {
    id: activity.id,
    type: activity.type,
    fromStatus: activity.fromStatus,
    toStatus: activity.toStatus,
    createdAt: activity.createdAt.toISOString(),
    actor: activity.actor
      ? {
          id: activity.actor.id,
          name: activity.actor.name,
        }
      : null,
  }
}

function mapTaskFileToPayload(file: {
  id: string
  originalName: string
  url: string
  mimeType: string
  fileType: WorkspaceTaskFile["fileType"]
  sizeBytes: number
  createdAt: Date
  uploader: {
    id: string
    name: string
  } | null
}): WorkspaceTaskFile {
  return {
    id: file.id,
    originalName: file.originalName,
    url: file.url,
    mimeType: file.mimeType,
    fileType: file.fileType,
    sizeBytes: file.sizeBytes,
    createdAt: file.createdAt.toISOString(),
    uploader: file.uploader,
  }
}

export async function createTaskAction(
  input: CreateTaskInput
): Promise<ActionResult<CreateTaskPayload>> {
  const userId = await getAuthUserIdFromCookie()
  if (!userId) {
    return { ok: false, error: "Unauthorized" }
  }

  const parsedBody = taskCreateSchema.safeParse({
    title: input.title,
    description: input.description,
    status: input.status,
    files: input.files,
  })

  if (!parsedBody.success) {
    return { ok: false, error: "Invalid task details" }
  }

  try {
    const workspace = await prisma.workspace.findUnique({
      where: {
        id: input.workspaceId,
      },
      select: {
        id: true,
      },
    })

    if (!workspace) {
      return { ok: false, error: "Workspace not found" }
    }

    const statusToCreate = parsedBody.data.status ?? "NEW"

    const task = await prisma.task.create({
      data: {
        title: parsedBody.data.title,
        description: parsedBody.data.description,
        status: statusToCreate,
        workspaceId: input.workspaceId,
        creatorId: userId,
        files:
          parsedBody.data.files && parsedBody.data.files.length > 0
            ? {
                create: parsedBody.data.files.map((file) => ({
                  originalName: file.originalName,
                  storageName: file.storageName,
                  url: file.url,
                  mimeType: file.mimeType,
                  fileType: file.fileType,
                  sizeBytes: file.sizeBytes,
                  uploaderId: userId,
                })),
              }
            : undefined,
        activities: {
          create: {
            type: "CREATED",
            actorId: userId,
            toStatus: statusToCreate,
          },
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        workspaceId: true,
      },
    })

    revalidatePath("/", "layout")
    revalidatePath(`/workspaces/${task.workspaceId}`)
    revalidatePath("/workspaces")
    revalidatePath("/files")

    return {
      ok: true,
      data: {
        task: {
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
        },
      },
    }
  } catch (error) {
    console.error("Create task action error:", error)
    return { ok: false, error: "Failed to create task" }
  }
}

export async function updateTaskStatusAction(
  input: UpdateTaskStatusInput
): Promise<ActionResult<UpdateTaskStatusPayload>> {
  const userId = await getAuthUserIdFromCookie()
  if (!userId) {
    return { ok: false, error: "Unauthorized" }
  }

  const parsedBody = taskUpdateSchema.safeParse({
    status: input.status,
  })

  if (!parsedBody.success || !parsedBody.data.status) {
    return { ok: false, error: "Invalid task status" }
  }

  try {
    const existingTask = await prisma.task.findUnique({
      where: { id: input.taskId },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        deletedAt: true,
        workspaceId: true,
      },
    })

    if (!existingTask) {
      return { ok: false, error: "Task not found" }
    }

    if (existingTask.deletedAt) {
      return { ok: false, error: "Cannot move a deleted task" }
    }

    if (existingTask.status === parsedBody.data.status) {
      return {
        ok: true,
        data: {
          task: {
            id: existingTask.id,
            title: existingTask.title,
            description: existingTask.description,
            status: existingTask.status,
          },
          activity: undefined,
        },
      }
    }

    const [updatedTask, activity] = await prisma.$transaction([
      prisma.task.update({
        where: { id: input.taskId },
        data: {
          status: parsedBody.data.status,
        },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          workspaceId: true,
        },
      }),
      prisma.taskActivity.create({
        data: {
          taskId: input.taskId,
          actorId: userId,
          type: "STATUS_CHANGED",
          fromStatus: existingTask.status,
          toStatus: parsedBody.data.status,
        },
        select: {
          id: true,
          type: true,
          fromStatus: true,
          toStatus: true,
          createdAt: true,
          actor: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ])

    revalidatePath("/", "layout")
    revalidatePath(`/workspaces/${updatedTask.workspaceId}`)
    revalidatePath("/workspaces")

    return {
      ok: true,
      data: {
        task: {
          id: updatedTask.id,
          title: updatedTask.title,
          description: updatedTask.description,
          status: updatedTask.status,
        },
        activity: mapTaskActivityToPayload(activity),
      },
    }
  } catch (error) {
    console.error("Update task status action error:", error)
    return { ok: false, error: "Failed to update task status" }
  }
}

export async function getTaskDetailsAction(
  input: GetTaskDetailsInput
): Promise<ActionResult<GetTaskDetailsPayload>> {
  const userId = await getAuthUserIdFromCookie()
  if (!userId) {
    return { ok: false, error: "Unauthorized" }
  }

  if (!input.taskId) {
    return { ok: false, error: "Task id is required" }
  }

  try {
    const task = await prisma.task.findUnique({
      where: { id: input.taskId },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        files: {
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            originalName: true,
            url: true,
            mimeType: true,
            fileType: true,
            sizeBytes: true,
            createdAt: true,
            uploader: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        activities: {
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            type: true,
            fromStatus: true,
            toStatus: true,
            createdAt: true,
            actor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    if (!task) {
      return { ok: false, error: "Task not found" }
    }

    return {
      ok: true,
      data: {
        task: {
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
          deletedAt: task.deletedAt?.toISOString() ?? null,
          files: task.files.map(mapTaskFileToPayload),
          activities: task.activities.map(mapTaskActivityToPayload),
        },
      },
    }
  } catch (error) {
    console.error("Get task details action error:", error)
    return { ok: false, error: "Failed to fetch task details" }
  }
}

export async function softDeleteTaskAction(
  input: SoftDeleteTaskInput
): Promise<ActionResult<SoftDeleteTaskPayload>> {
  const userId = await getAuthUserIdFromCookie()
  if (!userId) {
    return { ok: false, error: "Unauthorized" }
  }

  if (!input.taskId) {
    return { ok: false, error: "Task id is required" }
  }

  try {
    const existingTask = await prisma.task.findUnique({
      where: { id: input.taskId },
      select: {
        id: true,
        status: true,
        deletedAt: true,
        workspaceId: true,
      },
    })

    if (!existingTask) {
      return { ok: false, error: "Task not found" }
    }

    if (existingTask.deletedAt) {
      return { ok: false, error: "Task is already deleted" }
    }

    const now = new Date()

    const [deletedTask, activity] = await prisma.$transaction([
      prisma.task.update({
        where: { id: input.taskId },
        data: {
          deletedAt: now,
        },
        select: {
          id: true,
          workspaceId: true,
          deletedAt: true,
        },
      }),
      prisma.taskActivity.create({
        data: {
          taskId: input.taskId,
          actorId: userId,
          type: "DELETED",
          fromStatus: existingTask.status,
        },
        select: {
          id: true,
          type: true,
          fromStatus: true,
          toStatus: true,
          createdAt: true,
          actor: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ])

    revalidatePath("/", "layout")
    revalidatePath(`/workspaces/${deletedTask.workspaceId}`)
    revalidatePath("/workspaces")
    revalidatePath("/tasks/deleted")
    revalidatePath("/files")

    return {
      ok: true,
      data: {
        task: {
          id: deletedTask.id,
          workspaceId: deletedTask.workspaceId,
          deletedAt:
            deletedTask.deletedAt?.toISOString() ?? new Date().toISOString(),
        },
        activity: mapTaskActivityToPayload(activity),
      },
    }
  } catch (error) {
    console.error("Soft delete task action error:", error)
    return { ok: false, error: "Failed to delete task" }
  }
}

export async function restoreTaskAction(
  input: RestoreTaskInput
): Promise<ActionResult<RestoreTaskPayload>> {
  const userId = await getAuthUserIdFromCookie()
  if (!userId) {
    return { ok: false, error: "Unauthorized" }
  }

  if (!input.taskId) {
    return { ok: false, error: "Task id is required" }
  }

  try {
    const existingTask = await prisma.task.findUnique({
      where: { id: input.taskId },
      select: {
        id: true,
        status: true,
        deletedAt: true,
        workspaceId: true,
      },
    })

    if (!existingTask) {
      return { ok: false, error: "Task not found" }
    }

    if (!existingTask.deletedAt) {
      return { ok: false, error: "Task is not deleted" }
    }

    const [restoredTask, activity] = await prisma.$transaction([
      prisma.task.update({
        where: { id: input.taskId },
        data: {
          deletedAt: null,
        },
        select: {
          id: true,
          workspaceId: true,
        },
      }),
      prisma.taskActivity.create({
        data: {
          taskId: input.taskId,
          actorId: userId,
          type: "RESTORED",
          toStatus: existingTask.status,
        },
        select: {
          id: true,
          type: true,
          fromStatus: true,
          toStatus: true,
          createdAt: true,
          actor: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ])

    revalidatePath("/", "layout")
    revalidatePath(`/workspaces/${restoredTask.workspaceId}`)
    revalidatePath("/workspaces")
    revalidatePath("/tasks/deleted")
    revalidatePath("/files")

    return {
      ok: true,
      data: {
        task: {
          id: restoredTask.id,
          workspaceId: restoredTask.workspaceId,
        },
        activity: mapTaskActivityToPayload(activity),
      },
    }
  } catch (error) {
    console.error("Restore task action error:", error)
    return { ok: false, error: "Failed to restore task" }
  }
}
