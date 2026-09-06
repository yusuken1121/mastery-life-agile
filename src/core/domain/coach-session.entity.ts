import type { Message } from "./message.entity"
import type { EpicProposal } from "./epic.entity"
import type { PbiProposal } from "./pbi.entity"
import type { SprintPlanProposal } from "./sprint.entity"
import type { RetroProposal } from "./retrospective.entity"

export const COACH_PHASES = [
  "intake",
  "coaching_epic",
  "epic_review",
  "coaching_pbi",
  "pbi_review",
  "planning_review",
  "retro_review",
] as const

export type CoachPhase = (typeof COACH_PHASES)[number]

export const INPUT_CLASSIFICATIONS = [
  "new_epic",
  "existing_epic",
  "single_task",
  "memo",
] as const

export type InputClassification = (typeof INPUT_CLASSIFICATIONS)[number]

export interface CoachSession {
  id: string
  phase: CoachPhase
  messages: Message[]
  classification?: InputClassification
  relatedEpicId?: string
  confirmedEpicId?: string
  pendingEpic?: EpicProposal
  pendingPbis?: PbiProposal[]
  pendingPlan?: SprintPlanProposal
  pendingRetro?: RetroProposal
  lastAlert?: "planning" | "retro"
  updatedAt: string
}

export function createEmptySession(id = "default"): CoachSession {
  return {
    id,
    phase: "intake",
    messages: [],
    updatedAt: new Date().toISOString(),
  }
}

export function hasPendingApproval(session: CoachSession): boolean {
  return Boolean(
    session.pendingEpic ||
    session.pendingPbis?.length ||
    session.pendingPlan ||
    session.pendingRetro,
  )
}
