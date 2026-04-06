import type { Metadata } from "next"

import { AuthPageShell } from "@/components/auth/auth-page-shell"
import { RegisterForm } from "@/components/auth/register-form"

export const metadata: Metadata = {
  title: "Register",
  description: "Create a new account",
}

export default function RegisterPage() {
  return (
    <AuthPageShell
      title="Create account"
      description="Set up your account to start organizing boards."
      footerText="Already have an account?"
      footerLinkText="Sign in"
      footerLinkHref="/login"
    >
      <RegisterForm />
    </AuthPageShell>
  )
}
