import { DashboardShell } from "@/components/layout/dashboard-shell"
import { WorkspacesDirectory } from "@/components/workspaces/workspaces-directory"
import { getWorkspaceListItems } from "@/lib/server/workspaces/queries"

export default async function WorkspacesPage() {
  const workspaces = await getWorkspaceListItems()

  return (
    <DashboardShell
      title="Workspaces"
      description="Organize teams, projects, and task boards in one place."
    >
      <WorkspacesDirectory workspaces={workspaces} />
    </DashboardShell>
  )
}
