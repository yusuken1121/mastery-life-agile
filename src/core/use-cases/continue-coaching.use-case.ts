import { createMessage } from "../domain/message.entity"
import {
  createEmptySession,
  type CoachSession,
} from "../domain/coach-session.entity"
import {
  parseCoachTurn,
  InvalidCoachTurnError,
} from "../domain/coach-turn.entity"
import type { AppSettings } from "../domain/app-settings.vo"
import type { Epic } from "../domain/epic.entity"
import type { Pbi } from "../domain/pbi.entity"
import type { IAIGateway } from "../ports/ai-gateway.port"
import type { IBacklogRepository } from "../ports/backlog-repository.port"
import type { ISessionStore } from "../ports/session-store.port"

const JSON_CONTRACT = `JSONスキーマ:
{
  "assistantMessage": string,
  "classification": "new_epic" | "existing_epic" | "single_task" | "memo" | null,
  "phase": "intake" | "coaching_epic" | "epic_review" | "coaching_pbi" | "pbi_review" | "planning_review" | "retro_review",
  "epicProposal": { "title": string, "why": string, "successDefinition": string, "dueDate": string | null, "category": "キャリア"|"健康"|"学習"|"家庭"|"その他" } | null,
  "pbiProposals": [{ "title": string, "acceptanceCriteria": string, "estimateHours": number, "priority": "高"|"中"|"低", "tooLarge": boolean }] | null,
  "awaitingApproval": boolean,
  "relatedEpicIds": string[],
  "duplicateWarnings": string[]
}

ルール:
- 深掘り中は epicProposal / pbiProposals を null、awaitingApproval を false。
- エピック案を出す準備ができたら phase を epic_review、awaitingApproval を true。
- PBI案を出す準備ができたら phase を pbi_review、awaitingApproval を true。tooLarge は見積が8h超なら true。`

export interface ContinueCoachingInput {
  sessionId: string
  content: string
  audioBase64?: string
  audioMimeType?: string
}

export interface ContinueCoachingOutput {
  session: CoachSession
  assistantMessage: string
  awaitingApproval: boolean
}

export class ContinueCoachingUseCase {
  constructor(
    private readonly ai: IAIGateway,
    private readonly sessions: ISessionStore,
    private readonly backlog: IBacklogRepository,
    private readonly settings: AppSettings,
    private readonly systemPrompt: string,
  ) {}

  async execute(input: ContinueCoachingInput): Promise<ContinueCoachingOutput> {
    const session =
      (await this.sessions.get(input.sessionId)) ??
      createEmptySession(input.sessionId)

    const [epics, pbis] = await Promise.all([
      this.backlog.listEpics(),
      this.backlog.listPbis(),
    ])

    const userText = input.content.trim() || "（音声入力）"
    session.messages.push(
      createMessage("user", userText, undefined, {
        audioBase64: input.audioBase64,
        audioMimeType: input.audioMimeType,
      }),
    )

    const raw = await this.ai.generate(session.messages, {
      model: this.settings.model,
      temperature: 0.4,
      maxTokens: 4096,
      jsonMode: true,
      systemPrompt: [
        this.systemPrompt,
        JSON_CONTRACT,
        "# 現在のセッション",
        `phase: ${session.phase}`,
        session.confirmedEpicId
          ? `confirmedEpicId: ${session.confirmedEpicId}`
          : "",
        "# 既存バックログ",
        summarizeBacklog(epics, pbis),
      ]
        .filter(Boolean)
        .join("\n"),
    })

    let turn
    try {
      turn = parseCoachTurn(JSON.parse(extractJson(raw)))
    } catch (error) {
      if (error instanceof InvalidCoachTurnError) throw error
      throw new InvalidCoachTurnError("AI応答のJSONを解析できませんでした")
    }

    session.phase = turn.phase
    if (turn.classification) session.classification = turn.classification
    if (turn.relatedEpicIds[0]) session.relatedEpicId = turn.relatedEpicIds[0]
    session.pendingEpic = turn.epicProposal ?? undefined
    session.pendingPbis = turn.pbiProposals ?? undefined
    session.messages.push(createMessage("assistant", turn.assistantMessage))
    session.updatedAt = new Date().toISOString()
    await this.sessions.save(stripAudio(session))

    return {
      session: stripAudio(session),
      assistantMessage: turn.assistantMessage,
      awaitingApproval: turn.awaitingApproval,
    }
  }
}

function summarizeBacklog(epics: Epic[], pbis: Pbi[]): string {
  const epicLines = epics
    .slice(0, 20)
    .map(
      (epic) =>
        `- [${epic.id}] ${epic.title} (${epic.status}/${epic.category})`,
    )
    .join("\n")
  const pbiLines = pbis
    .slice(0, 40)
    .map(
      (pbi) =>
        `- [${pbi.id}] ${pbi.title} (${pbi.status}/${pbi.priority}/${pbi.estimateHours}h)`,
    )
    .join("\n")

  return `Epics:\n${epicLines || "(なし)"}\nPBIs:\n${pbiLines || "(なし)"}`
}

function extractJson(raw: string): string {
  const trimmed = raw.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  return fenced?.[1]?.trim() ?? trimmed
}

function stripAudio(session: CoachSession): CoachSession {
  return {
    ...session,
    messages: session.messages.map((message) => ({
      ...message,
      metadata: message.metadata
        ? Object.fromEntries(
            Object.entries(message.metadata).filter(
              ([key]) => key !== "audioBase64",
            ),
          )
        : undefined,
    })),
  }
}
