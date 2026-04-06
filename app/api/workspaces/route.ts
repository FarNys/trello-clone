import { NextResponse } from "next/server"

import { getAuthUserIdFromCookie } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { workspaceCreateSchema } from "@/lib/validations/workspace-task"

export const runtime = "nodejs"

export async function GET() {
  try {
    const workspaces = await prisma.workspace.findMany({
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    })

    return NextResponse.json({ workspaces }, { status: 200 })
  } catch (error) {
    console.error("List workspaces API error:", error)
    return NextResponse.json({ error: "Failed to load workspaces" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthUserIdFromCookie()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsedBody = workspaceCreateSchema.safeParse(body)

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          issues: parsedBody.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const workspace = await prisma.workspace.create({
      data: parsedBody.data,
    })

    return NextResponse.json({ workspace }, { status: 201 })
  } catch (error) {
    console.error("Create workspace API error:", error)
    return NextResponse.json({ error: "Failed to create workspace" }, { status: 500 })
  }
}
