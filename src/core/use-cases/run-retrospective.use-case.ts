import type { AppSettings } from "../domain/app-settings.vo"
import {
  createEmptySession,
  type CoachSession,
} from "../domain/coach-session.entity"
import { createMessage } from "../domain/message.entity"
import { formatSprintName, sprintRange } from "../domain/sprint-calendar"
import type { RetroProposal } from "../domain/retrospective.entity"
import type { IAIGateway } from "../ports/ai-gateway.port"
import type { IBacklogRepository } from "../ports/backlog-repository.port"
import type { ISessionStore } from "../ports/session-store.port"

export class MissingSprintError extends Error {
  constructor() {
    super("振り返るスプリントがありません")
    this.name = "MissingSprintError"
  }
}

export class RunRetrospectiveUseCase {
  constructor(
    private readonly ai: IAIGateway,
    private readonly sessions: ISessionStore,
    private readonly backlog: IBacklogRepository,
    private readonly settings: AppSettings,
    private readonly systemPrompt: string,
  ) {}

  async execute(input: {
    sessionId: string
    now?: Date
    notes?: string
  }): Promise<CoachSession> {
    const now = input.now ?? new Date()
    const { start } = sprintRange(now, this.settings.sprint)
    const name = formatSprintName(start)
    const sprint =
      (await this.backlog.findSprintByName(name)) ??
      (await this.backlog.listSprints()).at(-1)
    if (!sprint) {
      throw new MissingSprintError()
    }

    const pbis = (await this.backlog.listPbis()).filter(
      (pbi) => pbi.sprintId === sprint.id,
    )
    const done = pbis.filter((pbi) => pbi.status === "Done").length
    const completionRate = pbis.length
      ? Math.round((done / pbis.length) * 100)
      : 0
    const carryOver = pbis
      .filter((pbi) => pbi.status !== "Done")
      .map((pbi) => pbi.title)

    const raw = await this.ai.generate(
      [
        createMessage(
          "user",
          [
            `スプリント: ${sprint.name}`,
            `ゴール: ${sprint.goal}`,
            `完了率: ${completionRate}% (${done}/${pbis.length})`,
            `持ち越し: ${carryOver.join(", ") || "なし"}`,
            input.notes ? `ユーザーのメモ: ${input.notes}` : "",
          ]
            .filter(Boolean)
            .join("\n"),
        ),
      ],
      {
        model: this.settings.model,
        temperature: 0.4,
        jsonMode: true,
        systemPrompt: `${this.systemPrompt}\nJSON: { "keep": string, "problem": string, "tryNext": string, "aiComment": string, "assistantMessage": string }`,
      },
    )

    const parsed = parseRetroJson(raw)
    const pendingRetro: RetroProposal = {
      sprintId: sprint.id,
      sprintName: sprint.name,
      keep: parsed.keep,
      problem: parsed.problem,
      tryNext: parsed.tryNext,
      aiComment: parsed.aiComment,
      completionRate,
    }

    const session =
      (await this.sessions.get(input.sessionId)) ??
      createEmptySession(input.sessionId)
    session.pendingRetro = pendingRetro
    session.phase = "retro_review"
    session.lastAlert = "retro"
    session.messages.push(
      createMessage(
        "assistant",
        parsed.assistantMessage ||
          `完了率は ${completionRate}% でした。Keep / Problem / Try の案を出しています。修正して承認してください。`,
      ),
    )
    session.updatedAt = new Date().toISOString()
    await this.sessions.save(session)
    return session
  }
}

function parseRetroJson(raw: string): {
  keep: string
  problem: string
  tryNext: string
  aiComment: string
  assistantMessage: string
} {
  try {
    const parsed = JSON.parse(raw) as Record<string, string>
    return {
      keep: parsed.keep ?? "",
      problem: parsed.problem ?? "",
      tryNext: parsed.tryNext ?? "",
      aiComment: parsed.aiComment ?? "",
      assistantMessage: parsed.assistantMessage ?? "",
    }
  } catch {
    return {
      keep: "",
      problem: "",
      tryNext: "",
      aiComment: "",
      assistantMessage: raw,
    }
  }
}
