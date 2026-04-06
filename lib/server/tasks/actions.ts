"use server"

import { revalidatePath } from "next/cache"

import { getAuthUserIdFromCookie } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { ActionResult } from "@/lib/server/action-result"
import type { WorkspaceTask } from "@/lib/types/workspace"
import {
  type TaskStatusValue,
  taskCreateSchema,
  taskUpdateSchema,
} from "@/lib/validations/workspace-task"

type CreateTaskInput = {
  workspaceId: string
  title: string
  description?: string
  status: TaskStatusValue
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
        workspaceId: true,
      },
    })

    if (!existingTask) {
      return { ok: false, error: "Task not found" }
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
        },
      }
    }

    const [updatedTask] = await prisma.$transaction([
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
      },
    }
  } catch (error) {
    console.error("Update task status action error:", error)
    return { ok: false, error: "Failed to update task status" }
  }
}
