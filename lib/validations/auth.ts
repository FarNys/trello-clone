import { z } from "zod"

const emailSchema = z.string().trim().toLowerCase().email()
const roleSchema = z.enum(["ADMIN", "USER"])

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: emailSchema,
  password: z.string().min(8).max(72),
  role: roleSchema.optional(),
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(72),
})
