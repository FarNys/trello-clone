import { DashboardShell } from "@/components/layout/dashboard-shell"
import { WorkspacesDirectorySkeleton } from "@/components/workspaces/workspaces-directory-skeleton"

export default function WorkspacesLoading() {
  return (
    <DashboardShell
      title="Workspaces"
      description="Organize teams, projects, and task boards in one place."
    >
      <WorkspacesDirectorySkeleton />
    </DashboardShell>
  )
}
