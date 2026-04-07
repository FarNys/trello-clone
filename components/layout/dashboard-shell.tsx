import { AppSidebar } from "@/components/layout/app-sidebar"
import { CreateWorkspaceModal } from "@/components/workspaces/create-workspace-modal"
import { cn } from "@/lib/utils"

type DashboardShellProps = {
  title: string
  description: string
  children: React.ReactNode
  fullHeight?: boolean
}

export function DashboardShell({
  title,
  description,
  children,
  fullHeight = false,
}: DashboardShellProps) {
  return (
    <div
      className={cn(
        "bg-gradient-to-br from-background via-background to-muted/35 md:grid md:grid-cols-[280px_1fr]",
        fullHeight ? "h-svh overflow-hidden" : "min-h-svh"
      )}
    >
      <AppSidebar />

      <main
        className={cn("p-5 md:p-6", fullHeight && "min-h-0 overflow-hidden")}
      >
        <div
          className={cn(
            "mx-auto flex w-full flex-col gap-6 md:w-[96%]",
            fullHeight && "h-full min-h-0"
          )}
        >
          <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>

            <CreateWorkspaceModal />
          </header>

          <div className={cn(fullHeight && "min-h-0 flex-1")}>{children}</div>
        </div>
      </main>
    </div>
  )
}
