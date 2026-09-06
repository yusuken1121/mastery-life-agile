import { apiClient } from "./apiClient"
import type { CoachSession } from "@/core/domain/coach-session.entity"
import type { ApprovalKind } from "@/core/use-cases/approve-proposal.use-case"
import type { NotionPageRef } from "@/core/domain/notion-page-ref"

interface Envelope<T> {
  success: boolean
  data: T
}

export const coachApi = {
  getSession: async (sessionId = "default") => {
    const result = (await apiClient.get("/api/coach/session", {
      params: { sessionId },
    })) as Envelope<{ session: CoachSession }>
    return result.data.session
  },

  turn: async (input: {
    sessionId?: string
    content?: string
    audioBase64?: string
    audioMimeType?: string
  }) => {
    const result = (await apiClient.post("/api/coach/turn", {
      sessionId: "default",
      ...input,
    })) as Envelope<{
      session: CoachSession
      assistantMessage: string
      awaitingApproval: boolean
    }>
    return result.data
  },

  approve: async (kind: ApprovalKind, sessionId = "default") => {
    const result = (await apiClient.post("/api/coach/approve", {
      sessionId,
      kind,
    })) as Envelope<{
      session: CoachSession
      pages: NotionPageRef[]
      skippedDuplicates: number
    }>
    return result.data
  },

  reject: async (kind: ApprovalKind, sessionId = "default") => {
    const result = (await apiClient.post("/api/coach/reject", {
      sessionId,
      kind,
    })) as Envelope<{ session: CoachSession }>
    return result.data.session
  },

  plan: async (sessionId = "default") => {
    const result = (await apiClient.post("/api/coach/plan", {
      sessionId,
    })) as Envelope<{ session: CoachSession }>
    return result.data.session
  },

  retro: async (notes?: string, sessionId = "default") => {
    const result = (await apiClient.post("/api/coach/retro", {
      sessionId,
      notes,
    })) as Envelope<{ session: CoachSession }>
    return result.data.session
  },
}
