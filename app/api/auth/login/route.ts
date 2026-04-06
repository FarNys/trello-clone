import { NextResponse } from "next/server"

import { setAuthCookie, signAuthToken, verifyPassword } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { loginSchema } from "@/lib/validations/auth"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsedBody = loginSchema.safeParse(body)

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          issues: parsedBody.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { email, password } = parsedBody.data

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        passwordHash: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const isPasswordValid = await verifyPassword(password, user.passwordHash)
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const token = signAuthToken({ userId: user.id, email: user.email })
    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
      },
      { status: 200 }
    )

    setAuthCookie(response, token)
    return response
  } catch (error) {
    console.error("Login API error:", error)
    return NextResponse.json({ error: "Failed to login user" }, { status: 500 })
  }
}
