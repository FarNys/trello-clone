import { z } from "zod"

import { taskFileTypeValues } from "@/lib/constants/files"

export const filesFilterSchema = z.enum(taskFileTypeValues)

export type FilesFilterValue = z.infer<typeof filesFilterSchema>
