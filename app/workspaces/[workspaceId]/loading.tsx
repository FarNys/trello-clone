import { DashboardShell } from "@/components/layout/dashboard-shell"
import { WorkspaceKanbanSkeleton } from "@/components/workspaces/workspace-kanban-skeleton"

export default function WorkspaceLoading() {
  return (
    <DashboardShell
      title="Workspace Board"
      description="Loading workspace board..."
    >
      <WorkspaceKanbanSkeleton />
    </DashboardShell>
  )
}
