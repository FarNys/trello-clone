"use server"

import { revalidatePath } from "next/cache"

import { getAuthUserIdFromCookie } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { ActionResult } from "@/lib/server/action-result"
import { workspaceCreateSchema } from "@/lib/validations/workspace-task"

type CreateWorkspaceInput = {
  name: string
  description?: string
}

type CreateWorkspacePayload = {
  workspace: {
    id: string
    name: string
    description?: string | null
  }
}

export async function createWorkspaceAction(
  input: CreateWorkspaceInput
): Promise<ActionResult<CreateWorkspacePayload>> {
  const userId = await getAuthUserIdFromCookie()
  if (!userId) {
    return { ok: false, error: "Unauthorized" }
  }

  const parsedBody = workspaceCreateSchema.safeParse(input)
  if (!parsedBody.success) {
    return { ok: false, error: "Invalid workspace details" }
  }

  try {
    const workspace = await prisma.workspace.create({
      data: parsedBody.data,
      select: {
        id: true,
        name: true,
        description: true,
      },
    })

    revalidatePath("/", "layout")
    revalidatePath("/")
    revalidatePath("/workspaces")

    return {
      ok: true,
      data: { workspace },
    }
  } catch (error) {
    console.error("Create workspace action error:", error)
    return { ok: false, error: "Failed to create workspace" }
  }
}
