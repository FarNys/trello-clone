"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { ThemeToggle } from "@/components/layout/theme-toggle"
import { Button } from "@/components/ui/button"
import type { WorkspaceListItem } from "@/lib/types/workspace"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  {
    href: "/workspaces",
    label: "Workspaces",
  },
  {
    href: "/users",
    label: "Users",
  },
  {
    href: "/tasks/deleted",
    label: "Deleted Tasks",
  },
  {
    href: "/files",
    label: "Files",
  },
]

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

type AppSidebarClientProps = {
  workspaces: WorkspaceListItem[]
}

export function AppSidebarClient({ workspaces }: AppSidebarClientProps) {
  const pathname = usePathname()

  return (
    <aside className="border-b border-border bg-sidebar/70 px-4 py-4 backdrop-blur md:h-svh md:border-r md:border-b-0 md:px-5 md:py-6">
      <div className="flex h-full flex-col gap-5">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg border border-border bg-background/70 px-3 py-2"
        >
          <div className="grid size-9 place-content-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
            F
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">FTask</p>
            <p className="truncate text-xs text-muted-foreground">
              Focused task workspace
            </p>
          </div>
        </Link>

        <nav className="space-y-2">
          <p className="px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Navigation
          </p>

          {NAV_ITEMS.map((item) => {
            const active = isActivePath(pathname, item.href)

            return (
              <Button
                key={item.href}
                asChild
                variant={active ? "secondary" : "ghost"}
                className={cn(
                  "h-auto w-full items-start justify-start px-3 py-2 text-left",
                  active && "border border-border"
                )}
              >
                <Link href={item.href}>
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              </Button>
            )
          })}
        </nav>

        <div className="space-y-2">
          <p className="px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Workspaces
          </p>

          <div className="space-y-1">
            {workspaces.length === 0 && (
              <p className="px-2 text-xs text-muted-foreground">No workspaces found</p>
            )}

            {workspaces.map((workspace) => {
              const href = `/workspaces/${workspace.id}`
              const active = isActivePath(pathname, href)

              return (
                <Button
                  key={workspace.id}
                  asChild
                  variant={active ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-8 w-full justify-start px-3 text-left",
                    active && "border border-border"
                  )}
                >
                  <Link href={href}>
                    <span className="truncate text-xs font-medium">{workspace.name}</span>
                  </Link>
                </Button>
              )
            })}
          </div>
        </div>

        <div className="mt-auto">
          <ThemeToggle />
        </div>
      </div>
    </aside>
  )
}
