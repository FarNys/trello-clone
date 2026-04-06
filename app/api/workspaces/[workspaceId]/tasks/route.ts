import { NextRequest, NextResponse } from "next/server"

import { getAuthUserIdFromCookie } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { taskCreateSchema, taskQuerySchema } from "@/lib/validations/workspace-task"

export const runtime = "nodejs"

type RouteContext = {
  params: Promise<{ workspaceId: string }>
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { workspaceId } = await params

    const query = taskQuerySchema.safeParse({
      userId: request.nextUrl.searchParams.get("userId") ?? undefined,
      assigneeId: request.nextUrl.searchParams.get("assigneeId") ?? undefined,
      creatorId: request.nextUrl.searchParams.get("creatorId") ?? undefined,
      status: request.nextUrl.searchParams.get("status") ?? undefined,
    })

    if (!query.success) {
      return NextResponse.json(
        {
          error: "Invalid query params",
          issues: query.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const filters = query.data
    const andConditions: Array<Record<string, unknown>> = [{ workspaceId }]

    if (filters.assigneeId) {
      andConditions.push({ assigneeId: filters.assigneeId })
    }

    if (filters.creatorId) {
      andConditions.push({ creatorId: filters.creatorId })
    }

    if (filters.status) {
      andConditions.push({ status: filters.status })
    }

    if (filters.userId) {
      andConditions.push({
        OR: [{ creatorId: filters.userId }, { assigneeId: filters.userId }],
      })
    }

    const tasks = await prisma.task.findMany({
      where: {
        AND: andConditions,
      },
      orderBy: {
        updatedAt: "desc",
      },
      include: {
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
      },
    })

    return NextResponse.json({ tasks }, { status: 200 })
  } catch (error) {
    console.error("List workspace tasks API error:", error)
    return NextResponse.json(
      { error: "Failed to load workspace tasks" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const userId = await getAuthUserIdFromCookie()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { workspaceId } = await params
    const body = await request.json()
    const parsedBody = taskCreateSchema.safeParse(body)

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          issues: parsedBody.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const workspace = await prisma.workspace.findUnique({
      where: {
        id: workspaceId,
      },
      select: {
        id: true,
      },
    })

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    if (parsedBody.data.assigneeId) {
      if (parsedBody.data.status === "BACKLOG") {
        return NextResponse.json(
          { error: "Backlog items cannot have an assignee" },
          { status: 400 }
        )
      }

      const assignee = await prisma.user.findUnique({
        where: {
          id: parsedBody.data.assigneeId,
        },
        select: {
          id: true,
        },
      })

      if (!assignee) {
        return NextResponse.json({ error: "Assignee not found" }, { status: 404 })
      }
    }

    const statusToCreate = parsedBody.data.status ?? "NEW"

    const task = await prisma.task.create({
      data: {
        title: parsedBody.data.title,
        description: parsedBody.data.description,
        status: statusToCreate,
        workspaceId,
        creatorId: userId,
        assigneeId: parsedBody.data.assigneeId,
        activities: {
          create: [
            {
              type: "CREATED",
              actorId: userId,
              toStatus: statusToCreate,
            },
            ...(parsedBody.data.assigneeId
              ? [
                  {
                    type: "ASSIGNED" as const,
                    actorId: userId,
                    assigneeId: parsedBody.data.assigneeId,
                  },
                ]
              : []),
          ],
        },
      },
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

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    console.error("Create task API error:", error)
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 })
  }
}
