import Link from "next/link"

import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Page() {
  return (
    <DashboardShell
      title="Overview"
      description="Welcome to FTask. Use the sidebar to switch between workspaces and users."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Access</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/workspaces">Workspaces</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/users">Users</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/me">My account</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Authentication</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/register">Register</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
