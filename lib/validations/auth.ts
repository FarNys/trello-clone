import { z } from "zod"

const emailSchema = z.string().trim().toLowerCase().email()

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: emailSchema,
  password: z.string().min(8).max(72),
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(72),
})
