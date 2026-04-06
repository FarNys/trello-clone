import { AppSidebar } from "@/components/layout/app-sidebar"
import { CreateWorkspaceModal } from "@/components/workspaces/create-workspace-modal"

type DashboardShellProps = {
  title: string
  description: string
  children: React.ReactNode
}

export function DashboardShell({
  title,
  description,
  children,
}: DashboardShellProps) {
  return (
    <div className="min-h-svh bg-gradient-to-br from-background via-background to-muted/35 md:grid md:grid-cols-[280px_1fr]">
      <AppSidebar />

      <main className="p-5 md:p-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>

            <CreateWorkspaceModal />
          </header>

          {children}
        </div>
      </main>
    </div>
  )
}
