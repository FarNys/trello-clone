import "server-only"

import { cache } from "react"

import { prisma } from "@/lib/prisma"
import type { TaskStatusValue } from "@/lib/validations/workspace-task"

export type DeletedTaskTableItem = {
  id: string
  title: string
  status: TaskStatusValue
  deletedAt: string
  workspace: {
    id: string
    name: string
  }
}

export const getDeletedTasksTableItems = cache(
  async (): Promise<DeletedTaskTableItem[]> => {
    const tasks = await prisma.task.findMany({
      where: {
        deletedAt: {
          not: null,
        },
      },
      orderBy: {
        deletedAt: "desc",
      },
      select: {
        id: true,
        title: true,
        status: true,
        deletedAt: true,
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return tasks
      .filter(
        (
          task
        ): task is typeof task & {
          deletedAt: Date
        } => task.deletedAt !== null
      )
      .map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        deletedAt: task.deletedAt.toISOString(),
        workspace: task.workspace,
      }))
  }
)
