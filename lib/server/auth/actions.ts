"use server"

import { cookies } from "next/headers"

import { AUTH_COOKIE_NAME } from "@/lib/constants/auth"
import { hashPassword, signAuthToken, verifyPassword } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { ActionResult } from "@/lib/server/action-result"
import { loginSchema, registerSchema } from "@/lib/validations/auth"

type LoginInput = {
  email: string
  password: string
}

type RegisterInput = {
  name: string
  email: string
  password: string
  role?: "ADMIN" | "USER"
}

async function setAuthCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function loginAction(
  input: LoginInput
): Promise<ActionResult<{ userId: string }>> {
  const parsedBody = loginSchema.safeParse(input)
  if (!parsedBody.success) {
    return { ok: false, error: "Invalid email or password format" }
  }

  try {
    const { email, password } = parsedBody.data
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
      },
    })

    if (!user) {
      return { ok: false, error: "Invalid email or password" }
    }

    const isPasswordValid = await verifyPassword(password, user.passwordHash)
    if (!isPasswordValid) {
      return { ok: false, error: "Invalid email or password" }
    }

    const token = signAuthToken({ userId: user.id, email: user.email })
    await setAuthCookie(token)

    return { ok: true, data: { userId: user.id } }
  } catch (error) {
    console.error("Login action error:", error)
    return { ok: false, error: "Failed to sign in" }
  }
}

export async function registerAction(
  input: RegisterInput
): Promise<ActionResult<{ userId: string }>> {
  const parsedBody = registerSchema.safeParse(input)
  if (!parsedBody.success) {
    return { ok: false, error: "Invalid account details" }
  }

  try {
    const { name, email, password, role: requestedRole } = parsedBody.data

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })

    if (existingUser) {
      return { ok: false, error: "A user with this email already exists" }
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
        return { ok: false, error: "Only one admin account is allowed" }
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
        email: true,
      },
    })

    const token = signAuthToken({ userId: user.id, email: user.email })
    await setAuthCookie(token)

    return { ok: true, data: { userId: user.id } }
  } catch (error) {
    console.error("Register action error:", error)
    return { ok: false, error: "Failed to create account" }
  }
}

export async function logoutAction(): Promise<ActionResult<null>> {
  try {
    const cookieStore = await cookies()
    cookieStore.delete(AUTH_COOKIE_NAME)
    return { ok: true, data: null }
  } catch (error) {
    console.error("Logout action error:", error)
    return { ok: false, error: "Failed to sign out" }
  }
}
