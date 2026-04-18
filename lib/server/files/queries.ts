import "server-only"

import { cache } from "react"

import { prisma } from "@/lib/prisma"
import type { TaskFileTypeValue } from "@/lib/constants/files"

export type TaskFileListItem = {
  id: string
  originalName: string
  url: string
  mimeType: string
  fileType: TaskFileTypeValue
  sizeBytes: number
  createdAt: string
  task: {
    id: string
    title: string
    deletedAt: string | null
    workspace: {
      id: string
      name: string
    }
  }
  uploader: {
    id: string
    name: string
  } | null
}

export const getTaskFileListItems = cache(
  async (filterType?: TaskFileTypeValue): Promise<TaskFileListItem[]> => {
    const files = await prisma.taskFile.findMany({
      where: filterType
        ? {
            fileType: filterType,
          }
        : undefined,
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
        task: {
          select: {
            id: true,
            title: true,
            deletedAt: true,
            workspace: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    return files.map((file) => ({
      id: file.id,
      originalName: file.originalName,
      url: file.url,
      mimeType: file.mimeType,
      fileType: file.fileType,
      sizeBytes: file.sizeBytes,
      createdAt: file.createdAt.toISOString(),
      task: {
        id: file.task.id,
        title: file.task.title,
        deletedAt: file.task.deletedAt?.toISOString() ?? null,
        workspace: file.task.workspace,
      },
      uploader: file.uploader,
    }))
  }
)
