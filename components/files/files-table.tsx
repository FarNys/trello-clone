"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  TASK_FILE_TYPE_LABELS,
  type TaskFileTypeValue,
  taskFileTypeValues,
} from "@/lib/constants/files"
import type { TaskFileListItem } from "@/lib/server/files/queries"

type FilesFilterValue = "ALL" | TaskFileTypeValue

type FilesTableProps = {
  files: TaskFileListItem[]
  filter: FilesFilterValue
}

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
})

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  const units = ["KB", "MB", "GB"]
  let value = bytes / 1024
  let unitIndex = 0

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  return `${value.toFixed(1)} ${units[unitIndex]}`
}

export function FilesTable({ files, filter }: FilesTableProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleFilterChange(value: string) {
    const nextFilter = value as FilesFilterValue
    const params = new URLSearchParams(searchParams.toString())

    if (nextFilter === "ALL") {
      params.delete("type")
    } else {
      params.set("type", nextFilter)
    }

    const query = params.toString()
    router.push(query.length > 0 ? `${pathname}?${query}` : pathname)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {files.length.toString()} file(s) found
        </p>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Filter</span>
          <Select value={filter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by file type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              {taskFileTypeValues.map((fileType) => (
                <SelectItem key={fileType} value={fileType}>
                  {TASK_FILE_TYPE_LABELS[fileType]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {files.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No uploaded files found for this filter.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Workspace</TableHead>
              <TableHead>Uploaded By</TableHead>
              <TableHead>Uploaded At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((file) => (
              <TableRow key={file.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {file.fileType === "IMAGE" ? (
                      <Image
                        src={file.url}
                        alt={file.originalName}
                        width={44}
                        height={44}
                        className="size-11 rounded-md border border-border/70 object-cover"
                      />
                    ) : (
                      <div className="grid size-11 place-content-center rounded-md border border-border/70 text-xs text-muted-foreground">
                        {TASK_FILE_TYPE_LABELS[file.fileType]}
                      </div>
                    )}
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="max-w-[260px] truncate text-sm font-medium hover:underline"
                    >
                      {file.originalName}
                    </a>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" size="sm" radius="full">
                    {TASK_FILE_TYPE_LABELS[file.fileType]}
                  </Badge>
                </TableCell>
                <TableCell>{formatBytes(file.sizeBytes)}</TableCell>
                <TableCell className="max-w-[220px]">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/workspaces/${file.task.workspace.id}`}
                      className="truncate text-sm hover:underline"
                    >
                      {file.task.title}
                    </Link>
                    {file.task.deletedAt && (
                      <Badge variant="warning-light" size="sm" radius="full">
                        Deleted
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {file.task.workspace.name}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {file.uploader?.name ?? "Unknown"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {DATE_FORMATTER.format(new Date(file.createdAt))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
