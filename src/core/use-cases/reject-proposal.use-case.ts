import {
  createEmptySession,
  type CoachSession,
} from "../domain/coach-session.entity"
import { createMessage } from "../domain/message.entity"
import type { ISessionStore } from "../ports/session-store.port"

export type RejectKind = "epic" | "pbi" | "plan" | "retro"

export class RejectProposalUseCase {
  constructor(private readonly sessions: ISessionStore) {}

  async execute(input: {
    sessionId: string
    kind: RejectKind
  }): Promise<CoachSession> {
    const session =
      (await this.sessions.get(input.sessionId)) ??
      createEmptySession(input.sessionId)

    if (input.kind === "epic") session.pendingEpic = undefined
    if (input.kind === "pbi") session.pendingPbis = undefined
    if (input.kind === "plan") session.pendingPlan = undefined
    if (input.kind === "retro") session.pendingRetro = undefined

    session.phase = input.kind === "pbi" ? "coaching_pbi" : "intake"
    session.messages.push(
      createMessage(
        "assistant",
        "了解です。案は破棄しました。どこを直したいですか？",
      ),
    )
    session.updatedAt = new Date().toISOString()
    await this.sessions.save(session)
    return session
  }
}
