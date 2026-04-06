import { NextResponse } from "next/server"

import { hashPassword, setAuthCookie, signAuthToken } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { registerSchema } from "@/lib/validations/auth"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsedBody = registerSchema.safeParse(body)

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          issues: parsedBody.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { name, email, password, role: requestedRole } = parsedBody.data

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      )
    }

    const userCount = await prisma.user.count()
    let roleToCreate: "ADMIN" | "USER" = "USER"

    if (requestedRole === "USER") {
      roleToCreate = "USER"
    } else if (userCount === 0) {
      roleToCreate = "ADMIN"
    } else if (requestedRole === "ADMIN") {
      const existingAdmin = await prisma.user.findFirst({
        where: { role: "ADMIN" },
        select: { id: true },
      })

      if (existingAdmin) {
        return NextResponse.json(
          { error: "Only one admin account is allowed" },
          { status: 409 }
        )
      }

      roleToCreate = "ADMIN"
    }

    const passwordHash = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: roleToCreate,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    const token = signAuthToken({ userId: user.id, email: user.email })
    const response = NextResponse.json({ user }, { status: 201 })
    setAuthCookie(response, token)

    return response
  } catch (error) {
    console.error("Register API error:", error)
    return NextResponse.json({ error: "Failed to register user" }, { status: 500 })
  }
}
