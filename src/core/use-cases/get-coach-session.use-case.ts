import {
  createEmptySession,
  type CoachSession,
} from "../domain/coach-session.entity"
import type { ISessionStore } from "../ports/session-store.port"

export class GetCoachSessionUseCase {
  constructor(private readonly sessions: ISessionStore) {}

  async execute(sessionId: string): Promise<CoachSession> {
    return (await this.sessions.get(sessionId)) ?? createEmptySession(sessionId)
  }
}
