import { DashboardShell } from "@/components/layout/dashboard-shell"
import { DeletedTasksTable } from "@/components/tasks/deleted-tasks-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getDeletedTasksTableItems } from "@/lib/server/tasks/queries"

export default async function DeletedTasksPage() {
  const tasks = await getDeletedTasksTableItems()

  return (
    <DashboardShell
      title="Deleted Tasks"
      description="Review deleted tasks, inspect timelines, and recover tasks."
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Deleted Tasks Archive</CardTitle>
        </CardHeader>
        <CardContent>
          <DeletedTasksTable tasks={tasks} />
        </CardContent>
      </Card>
    </DashboardShell>
  )
}
