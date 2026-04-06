import bcrypt from "bcryptjs"
import jwt, { type JwtPayload } from "jsonwebtoken"
import { cookies } from "next/headers"
import type { NextResponse } from "next/server"

import { AUTH_COOKIE_NAME } from "@/lib/constants/auth"

const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7
const AUTH_TOKEN_EXPIRATION = "7d"

type AuthTokenPayload = JwtPayload & {
  userId: string
  email: string
}

function getJwtSecret() {
  const jwtSecret = process.env.JWT_SECRET

  if (!jwtSecret) {
    throw new Error("Missing JWT_SECRET environment variable")
  }

  return jwtSecret
}

function isAuthTokenPayload(
  payload: string | JwtPayload
): payload is AuthTokenPayload {
  if (typeof payload === "string") {
    return false
  }

  return (
    typeof payload.userId === "string" && typeof payload.email === "string"
  )
}

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(12)
  return bcrypt.hash(password, salt)
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash)
}

export function signAuthToken({
  userId,
  email,
}: {
  userId: string
  email: string
}) {
  return jwt.sign({ userId, email }, getJwtSecret(), {
    expiresIn: AUTH_TOKEN_EXPIRATION,
  })
}

export function verifyAuthToken(token: string) {
  try {
    const payload = jwt.verify(token, getJwtSecret())
    return isAuthTokenPayload(payload) ? payload : null
  } catch {
    return null
  }
}

export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
  })
}

export async function getAuthUserIdFromCookie() {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  const payload = verifyAuthToken(token)
  return payload?.userId ?? null
}
