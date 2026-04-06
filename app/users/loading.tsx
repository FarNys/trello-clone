import { DashboardShell } from "@/components/layout/dashboard-shell"
import { UsersTableSkeleton } from "@/components/users/users-table-skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function UsersLoading() {
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
          <UsersTableSkeleton />
        </CardContent>
      </Card>
    </DashboardShell>
  )
}
