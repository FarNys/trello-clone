import "server-only"

import { cache } from "react"

import { prisma } from "@/lib/prisma"

export type UsersTableItem = {
  id: string
  name: string
  email: string
  role: "ADMIN" | "USER"
  createdAt: Date
  _count: {
    createdTasks: number
    assignedTasks: number
  }
}

export const getUsersTableItems = cache(async (): Promise<UsersTableItem[]> => {
  return prisma.user.findMany({
    orderBy: [
      {
        role: "asc",
      },
      {
        createdAt: "desc",
      },
    ],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          createdTasks: true,
          assignedTasks: true,
        },
      },
    },
  })
})
