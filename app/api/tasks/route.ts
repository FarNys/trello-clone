import { NextRequest, NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { taskQuerySchema } from "@/lib/validations/workspace-task"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const query = taskQuerySchema.safeParse({
      workspaceId: request.nextUrl.searchParams.get("workspaceId") ?? undefined,
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
    const andConditions: Array<Record<string, unknown>> = []

    if (filters.workspaceId) {
      andConditions.push({ workspaceId: filters.workspaceId })
    }

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
      where: andConditions.length ? { AND: andConditions } : undefined,
      orderBy: {
        updatedAt: "desc",
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
      },
    })

    return NextResponse.json({ tasks }, { status: 200 })
  } catch (error) {
    console.error("List tasks API error:", error)
    return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 })
  }
}
