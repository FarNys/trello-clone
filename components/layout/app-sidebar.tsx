import { AppSidebarClient } from "@/components/layout/app-sidebar-client"
import { getWorkspaceListItems } from "@/lib/server/workspaces/queries"

export async function AppSidebar() {
  const workspaces = await getWorkspaceListItems()

  return <AppSidebarClient workspaces={workspaces} />
}
