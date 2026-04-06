import Link from "next/link"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type AuthPageShellProps = {
  title: string
  description: string
  footerText: string
  footerLinkText: string
  footerLinkHref: string
  children: React.ReactNode
}

export function AuthPageShell({
  title,
  description,
  footerText,
  footerLinkText,
  footerLinkHref,
  children,
}: AuthPageShellProps) {
  return (
    <main className="relative flex min-h-svh items-center justify-center p-6">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-background" />

      <Card className="relative z-10 w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>

        <CardContent>{children}</CardContent>

        <CardFooter className="text-sm text-muted-foreground">
          {footerText}{" "}
          <Link className="font-medium text-primary hover:underline" href={footerLinkHref}>
            {footerLinkText}
          </Link>
        </CardFooter>
      </Card>
    </main>
  )
}
