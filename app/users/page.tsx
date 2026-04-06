import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function UsersPage() {
  return (
    <DashboardShell
      title="Users"
      description="View members, roles, and participation across workspaces."
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">User Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            User management and permissions can be configured here.
          </p>
        </CardContent>
      </Card>
    </DashboardShell>
  )
}
