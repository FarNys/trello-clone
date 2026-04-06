import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const COLUMN_COUNT = 5

export function WorkspaceKanbanSkeleton() {
  return (
    <section className="space-y-4">
      <Card className="gap-3 py-4">
        <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-40" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-28" />
          </div>
        </CardContent>
      </Card>

      <div className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: COLUMN_COUNT }).map((_, index) => (
          <Card key={`kanban-column-skeleton-${index}`} className="h-full gap-3 py-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-8" />
            </CardHeader>
            <CardContent className="space-y-2">
              {Array.from({ length: 3 }).map((__, itemIndex) => (
                <div
                  key={`kanban-item-skeleton-${index}-${itemIndex}`}
                  className="rounded-lg border border-border p-3"
                >
                  <Skeleton className="h-4 w-11/12" />
                  <Skeleton className="mt-2 h-3 w-3/4" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
