import type { Metadata } from "next"

import { AuthPageShell } from "@/components/auth/auth-page-shell"
import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to your account",
}

export default function LoginPage() {
  return (
    <AuthPageShell
      title="Welcome back"
      description="Sign in to continue to your workspace."
      footerText="Don't have an account?"
      footerLinkText="Create one"
      footerLinkHref="/register"
    >
      <LoginForm />
    </AuthPageShell>
  )
}
