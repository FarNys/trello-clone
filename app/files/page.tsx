import { DashboardShell } from "@/components/layout/dashboard-shell"
import { FilesTable } from "@/components/files/files-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getTaskFileListItems } from "@/lib/server/files/queries"
import { filesFilterSchema } from "@/lib/validations/files"

type FilesPageProps = {
  searchParams: Promise<{
    type?: string
  }>
}

export default async function FilesPage({ searchParams }: FilesPageProps) {
  const { type } = await searchParams
  const parsedFilter = filesFilterSchema.safeParse(type)
  const filter = parsedFilter.success ? parsedFilter.data : undefined
  const files = await getTaskFileListItems(filter)

  return (
    <DashboardShell
      title="Files"
      description="Browse all uploaded task files and filter by file type."
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Files Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <FilesTable files={files} filter={filter ?? "ALL"} />
        </CardContent>
      </Card>
    </DashboardShell>
  )
}
