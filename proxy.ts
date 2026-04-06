import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { AUTH_COOKIE_NAME } from "@/lib/constants/auth"

const AUTH_PAGES = new Set(["/login", "/register"])

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(AUTH_COOKIE_NAME)
  const isAuthPage = AUTH_PAGES.has(pathname)
  // if ((!token || !token?.value) && !isAuthPage) {
  //   const loginUrl = new URL("/login", request.url)
  //   loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`)
  //   return NextResponse.redirect(loginUrl)
  // }

  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url))
  }
  return NextResponse.next()
}

export const proxyConfig = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
}
