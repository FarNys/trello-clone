import { AppSidebarClient } from "@/components/layout/app-sidebar-client"
import { getWorkspaceListItems } from "@/lib/data/workspaces"

export async function AppSidebar() {
  const workspaces = await getWorkspaceListItems()

  return <AppSidebarClient workspaces={workspaces} />
}
