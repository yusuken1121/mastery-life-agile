import type { NotionPageRef } from "../domain/notion-page-ref"
import type { Epic, EpicProposal } from "../domain/epic.entity"
import type { Pbi, PbiProposal } from "../domain/pbi.entity"
import type { RetroProposal } from "../domain/retrospective.entity"
import type { Sprint, SprintPlanProposal } from "../domain/sprint.entity"

export interface PbiPatch {
  status?: Pbi["status"]
  sprintId?: string
  scheduledDate?: string
}

export interface IBacklogRepository {
  listEpics(): Promise<Epic[]>
  listPbis(): Promise<Pbi[]>
  listSprints(): Promise<Sprint[]>
  findSprintByName(name: string): Promise<Sprint | null>
  findByExternalId(
    kind: "epic" | "pbi" | "sprint" | "retro",
    externalId: string,
  ): Promise<string | null>
  createEpic(proposal: EpicProposal, externalId: string): Promise<NotionPageRef>
  createPbi(
    proposal: PbiProposal,
    externalId: string,
    epicId?: string,
  ): Promise<NotionPageRef>
  updatePbi(pageId: string, patch: PbiPatch): Promise<void>
  createSprint(plan: SprintPlanProposal): Promise<NotionPageRef>
  createRetro(proposal: RetroProposal): Promise<NotionPageRef>
}
