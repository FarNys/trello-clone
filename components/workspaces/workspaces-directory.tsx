import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { WorkspaceListItem } from "@/lib/types/workspace"

type WorkspacesDirectoryProps = {
  workspaces: WorkspaceListItem[]
}

export function WorkspacesDirectory({ workspaces }: WorkspacesDirectoryProps) {
  if (workspaces.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Workspace List</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No workspaces yet. Create one to start organizing tasks.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {workspaces.map((workspace) => (
        <Card key={workspace.id}>
          <CardHeader>
            <CardTitle className="text-base">{workspace.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {(workspace._count?.tasks ?? 0).toString()} task(s)
            </p>
            <Button asChild size="sm">
              <Link href={`/workspaces/${workspace.id}`}>Open board</Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
