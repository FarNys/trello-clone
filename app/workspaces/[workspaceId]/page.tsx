import { notFound } from "next/navigation"

import { DashboardShell } from "@/components/layout/dashboard-shell"
import { WorkspaceKanban } from "@/components/workspaces/workspace-kanban"
import { getWorkspaceBoard } from "@/lib/server/workspaces/queries"

type WorkspacePageProps = {
  params: Promise<{ workspaceId: string }>
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { workspaceId } = await params
  const workspace = await getWorkspaceBoard(workspaceId)

  if (!workspace) {
    notFound()
  }

  return (
    <DashboardShell
      title={`${workspace.name} Board`}
      description={`Kanban board for workspace ${workspace.name}.`}
    >
      <WorkspaceKanban workspaceId={workspaceId} initialTasks={workspace.tasks} />
    </DashboardShell>
  )
}
