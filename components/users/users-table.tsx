import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { UsersTableItem } from "@/lib/server/users/queries"

type UsersTableProps = {
  users: UsersTableItem[]
}

export function UsersTable({ users }: UsersTableProps) {
  if (users.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No users found yet. Register to add teammates.
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Created Tasks</TableHead>
          <TableHead>Assigned Tasks</TableHead>
          <TableHead>Joined</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">{user.name}</TableCell>
            <TableCell className="text-muted-foreground">{user.email}</TableCell>
            <TableCell>
              <Badge
                variant={user.role === "ADMIN" ? "warning-light" : "secondary"}
                size="sm"
                radius="full"
              >
                {user.role === "ADMIN" ? "Admin" : "User"}
              </Badge>
            </TableCell>
            <TableCell>{user._count.createdTasks.toString()}</TableCell>
            <TableCell>{user._count.assignedTasks.toString()}</TableCell>
            <TableCell>{user.createdAt.toLocaleDateString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
