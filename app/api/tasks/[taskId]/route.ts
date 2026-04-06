import { NextResponse } from "next/server"

import { getAuthUserIdFromCookie } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  type TaskStatusValue,
  taskUpdateSchema,
} from "@/lib/validations/workspace-task"

export const runtime = "nodejs"

type RouteContext = {
  params: Promise<{ taskId: string }>
}

export async function GET(_: Request, { params }: RouteContext) {
  try {
    const { taskId } = await params

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        activities: {
          orderBy: {
            createdAt: "asc",
          },
          include: {
            actor: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    return NextResponse.json({ task }, { status: 200 })
  } catch (error) {
    console.error("Get task API error:", error)
    return NextResponse.json({ error: "Failed to load task" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const userId = await getAuthUserIdFromCookie()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { taskId } = await params
    const body = await request.json()
    const parsedBody = taskUpdateSchema.safeParse(body)

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          issues: parsedBody.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        status: true,
        assigneeId: true,
      },
    })

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const nextStatus = parsedBody.data.status ?? existingTask.status
    let nextAssigneeId =
      parsedBody.data.assigneeId !== undefined
        ? parsedBody.data.assigneeId
        : existingTask.assigneeId

    if (nextStatus === "BACKLOG" && nextAssigneeId !== null) {
      if (parsedBody.data.assigneeId !== undefined) {
        return NextResponse.json(
          { error: "Backlog items cannot have an assignee" },
          { status: 400 }
        )
      }

      nextAssigneeId = null
    }

    if (nextAssigneeId !== null && nextAssigneeId !== existingTask.assigneeId) {
      const assignee = await prisma.user.findUnique({
        where: { id: nextAssigneeId },
        select: { id: true },
      })

      if (!assignee) {
        return NextResponse.json({ error: "Assignee not found" }, { status: 404 })
      }
    }

    const updateData: {
      title?: string
      description?: string | null
      status?: TaskStatusValue
      assigneeId?: string | null
    } = {}

    if (parsedBody.data.title !== undefined) {
      updateData.title = parsedBody.data.title
    }

    if (parsedBody.data.description !== undefined) {
      updateData.description = parsedBody.data.description
    }

    if (parsedBody.data.status !== undefined) {
      updateData.status = parsedBody.data.status
    }

    const assigneeChanged = nextAssigneeId !== existingTask.assigneeId
    if (parsedBody.data.assigneeId !== undefined || assigneeChanged) {
      updateData.assigneeId = nextAssigneeId
    }

    const activityRows: Array<{
      taskId: string
      actorId: string
      type: "STATUS_CHANGED" | "ASSIGNED" | "UNASSIGNED"
      fromStatus?: TaskStatusValue
      toStatus?: TaskStatusValue
      assigneeId?: string | null
    }> = []

    if (parsedBody.data.status !== undefined && nextStatus !== existingTask.status) {
      activityRows.push({
        taskId,
        actorId: userId,
        type: "STATUS_CHANGED",
        fromStatus: existingTask.status,
        toStatus: nextStatus,
      })
    }

    if (assigneeChanged) {
      activityRows.push({
        taskId,
        actorId: userId,
        type: nextAssigneeId ? "ASSIGNED" : "UNASSIGNED",
        assigneeId: nextAssigneeId ?? null,
      })
    }

    const task = await prisma.$transaction(async (tx) => {
      await tx.task.update({
        where: { id: taskId },
        data: updateData,
      })

      if (activityRows.length > 0) {
        await tx.taskActivity.createMany({
          data: activityRows,
        })
      }

      return tx.task.findUnique({
        where: { id: taskId },
        include: {
          workspace: {
            select: {
              id: true,
              name: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          activities: {
            orderBy: {
              createdAt: "asc",
            },
            include: {
              actor: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              assignee: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      })
    })

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    return NextResponse.json({ task }, { status: 200 })
  } catch (error) {
    console.error("Update task API error:", error)
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 })
  }
}
