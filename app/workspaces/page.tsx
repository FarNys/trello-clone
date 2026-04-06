import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function WorkspacesPage() {
  return (
    <DashboardShell
      title="Workspaces"
      description="Organize teams, projects, and task boards in one place."
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Workspace List</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Create and manage your workspaces from here.
          </p>
        </CardContent>
      </Card>
    </DashboardShell>
  )
}
