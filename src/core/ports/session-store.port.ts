import type { CoachSession } from "../domain/coach-session.entity"

export interface ISessionStore {
  get(id: string): Promise<CoachSession | null>
  save(session: CoachSession): Promise<void>
}
