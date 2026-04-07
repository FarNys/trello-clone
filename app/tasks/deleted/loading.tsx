import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function DeletedTasksLoading() {
  return (
    <DashboardShell
      title="Deleted Tasks"
      description="Review deleted tasks, inspect timelines, and recover tasks."
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Deleted Tasks Archive</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </DashboardShell>
  )
}
