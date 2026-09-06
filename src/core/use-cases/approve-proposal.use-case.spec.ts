import { describe, expect, it } from "vitest"
import { ApproveProposalUseCase } from "./approve-proposal.use-case"
import { createEmptySession } from "../domain/coach-session.entity"
import type { IBacklogRepository } from "../ports/backlog-repository.port"
import type { ISessionStore } from "../ports/session-store.port"
import type { CoachSession } from "../domain/coach-session.entity"
import type { AppSettings } from "../domain/app-settings.vo"

const settings = {
  granularityHours: 8,
} as AppSettings

describe("ApproveProposalUseCase", () => {
  it("creates an epic only after approval and skips duplicates", async () => {
    const session = createEmptySession("default")
    session.pendingEpic = {
      title: "毎朝歩く",
      why: "体力を戻したい",
      successDefinition: "週5日、20分歩く",
      category: "健康",
    }

    const store: ISessionStore = {
      get: async () => session,
      save: async (next: CoachSession) => {
        Object.assign(session, next)
      },
    }

    const created: string[] = []
    const backlog = {
      findByExternalId: async () => created[0] ?? null,
      createEpic: async () => {
        created.push("epic-1")
        return { id: "epic-1", url: "https://notion.so/epic1" }
      },
    } as unknown as IBacklogRepository

    const useCase = new ApproveProposalUseCase(store, backlog, settings)
    const first = await useCase.execute({ sessionId: "default", kind: "epic" })
    expect(first.pages).toHaveLength(1)
    expect(session.pendingEpic).toBeUndefined()
    expect(session.confirmedEpicId).toBe("epic-1")

    session.pendingEpic = {
      title: "毎朝歩く",
      why: "体力を戻したい",
      successDefinition: "週5日、20分歩く",
      category: "健康",
    }
    const second = await useCase.execute({ sessionId: "default", kind: "epic" })
    expect(second.skippedDuplicates).toBe(1)
    expect(created).toHaveLength(1)
  })
})
