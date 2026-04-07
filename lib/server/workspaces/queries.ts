import "server-only"

import { cache } from "react"

import { prisma } from "@/lib/prisma"
import type { WorkspaceListItem, WorkspaceTask } from "@/lib/types/workspace"

export const getWorkspaceListItems = cache(async (): Promise<WorkspaceListItem[]> => {
  return prisma.workspace.findMany({
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      name: true,
      description: true,
      _count: {
        select: {
          tasks: {
            where: {
              deletedAt: null,
            },
          },
        },
      },
    },
  })
})

export const getWorkspaceBoard = cache(
  async (
    workspaceId: string
  ): Promise<{ id: string; name: string; tasks: WorkspaceTask[] } | null> => {
    return prisma.workspace.findUnique({
      where: {
        id: workspaceId,
      },
      select: {
        id: true,
        name: true,
        tasks: {
          where: {
            deletedAt: null,
          },
          orderBy: {
            updatedAt: "desc",
          },
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
          },
        },
      },
    })
  }
)
