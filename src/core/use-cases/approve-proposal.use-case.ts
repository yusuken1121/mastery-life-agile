import { assertValidEpicProposal } from "../domain/epic.entity"
import { assertValidPbiProposal } from "../domain/pbi.entity"
import { assertValidSprintPlan } from "../domain/sprint.entity"
import { assertValidRetroProposal } from "../domain/retrospective.entity"
import { fingerprint } from "../domain/fingerprint"
import type { NotionPageRef } from "../domain/notion-page-ref"
import type { AppSettings } from "../domain/app-settings.vo"
import type { CoachSession } from "../domain/coach-session.entity"
import { createMessage } from "../domain/message.entity"
import type { IBacklogRepository } from "../ports/backlog-repository.port"
import type { ISessionStore } from "../ports/session-store.port"

export type ApprovalKind = "epic" | "pbi" | "plan" | "retro"

export interface ApproveProposalInput {
  sessionId: string
  kind: ApprovalKind
}

export interface ApproveProposalOutput {
  session: CoachSession
  pages: NotionPageRef[]
  skippedDuplicates: number
}

export class MissingProposalError extends Error {
  constructor(kind: ApprovalKind) {
    super(`承認対象の${kind}がありません`)
    this.name = "MissingProposalError"
  }
}

export class ApproveProposalUseCase {
  constructor(
    private readonly sessions: ISessionStore,
    private readonly backlog: IBacklogRepository,
    private readonly settings: AppSettings,
  ) {}

  async execute(input: ApproveProposalInput): Promise<ApproveProposalOutput> {
    const session = await this.sessions.get(input.sessionId)
    if (!session) {
      throw new MissingProposalError(input.kind)
    }

    const pages: NotionPageRef[] = []
    let skippedDuplicates = 0

    if (input.kind === "epic") {
      if (!session.pendingEpic) throw new MissingProposalError("epic")
      assertValidEpicProposal(session.pendingEpic)
      const externalId = fingerprint("epic", [
        session.pendingEpic.title,
        session.pendingEpic.why,
      ])
      const existing = await this.backlog.findByExternalId("epic", externalId)
      if (existing) {
        skippedDuplicates += 1
        session.confirmedEpicId = existing
      } else {
        const page = await this.backlog.createEpic(
          session.pendingEpic,
          externalId,
        )
        pages.push(page)
        session.confirmedEpicId = page.id
      }
      session.pendingEpic = undefined
      session.phase = "coaching_pbi"
      session.messages.push(
        createMessage(
          "assistant",
          "エピックを登録しました。次は、1〜2週間で終わるタスクに分解します。最初の一歩は何だと思いますか？",
        ),
      )
    }

    if (input.kind === "pbi") {
      if (!session.pendingPbis?.length) throw new MissingProposalError("pbi")
      for (const proposal of session.pendingPbis) {
        assertValidPbiProposal(proposal, this.settings.granularityHours)
        if (proposal.tooLarge) continue
        const externalId = fingerprint("pbi", [
          proposal.title,
          session.confirmedEpicId ?? "",
        ])
        const existing = await this.backlog.findByExternalId("pbi", externalId)
        if (existing) {
          skippedDuplicates += 1
          continue
        }
        pages.push(
          await this.backlog.createPbi(
            proposal,
            externalId,
            session.confirmedEpicId,
          ),
        )
      }
      session.pendingPbis = undefined
      session.phase = "intake"
      session.messages.push(
        createMessage(
          "assistant",
          `PBIを${pages.length}件登録しました。重複スキップは${skippedDuplicates}件です。`,
        ),
      )
    }

    if (input.kind === "plan") {
      if (!session.pendingPlan) throw new MissingProposalError("plan")
      assertValidSprintPlan(session.pendingPlan)
      const existing = await this.backlog.findSprintByName(
        session.pendingPlan.name,
      )
      if (existing) {
        skippedDuplicates += 1
        session.pendingPlan = undefined
      } else {
        const sprintPage = await this.backlog.createSprint(session.pendingPlan)
        pages.push(sprintPage)
        for (const item of session.pendingPlan.items) {
          await this.backlog.updatePbi(item.pbiId, {
            status: "Sprint",
            sprintId: sprintPage.id,
            scheduledDate: item.scheduledDate,
          })
        }
        session.pendingPlan = undefined
      }
      session.phase = "intake"
      session.messages.push(
        createMessage("assistant", "今週のスプリントを確定しました。"),
      )
    }

    if (input.kind === "retro") {
      if (!session.pendingRetro) throw new MissingProposalError("retro")
      assertValidRetroProposal(session.pendingRetro)
      const externalId = fingerprint("retro", [session.pendingRetro.sprintId])
      const existing = await this.backlog.findByExternalId("retro", externalId)
      if (existing) {
        skippedDuplicates += 1
      } else {
        pages.push(await this.backlog.createRetro(session.pendingRetro))
      }
      session.pendingRetro = undefined
      session.phase = "intake"
      session.messages.push(
        createMessage(
          "assistant",
          "振り返りを記録しました。来週の計画に反映します。",
        ),
      )
    }

    session.updatedAt = new Date().toISOString()
    await this.sessions.save(session)
    return { session, pages, skippedDuplicates }
  }
}
