import { z } from "zod"

export const sessionIdSchema = z.string().min(1).default("default")

export const coachTurnSchema = z.object({
  sessionId: sessionIdSchema,
  content: z.string().optional().default(""),
  audioBase64: z.string().optional(),
  audioMimeType: z.string().optional(),
})

export const approvalSchema = z.object({
  sessionId: sessionIdSchema,
  kind: z.enum(["epic", "pbi", "plan", "retro"]),
})

export const planSchema = z.object({
  sessionId: sessionIdSchema,
})

export const retroSchema = z.object({
  sessionId: sessionIdSchema,
  notes: z.string().optional(),
})
