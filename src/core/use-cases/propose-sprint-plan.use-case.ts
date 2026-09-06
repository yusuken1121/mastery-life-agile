import type { AppSettings } from "../domain/app-settings.vo"
import {
  createEmptySession,
  type CoachSession,
} from "../domain/coach-session.entity"
import { createMessage } from "../domain/message.entity"
import { formatSprintName, sprintRange } from "../domain/sprint-calendar"
import { selectSprintItems } from "../domain/sprint-selection"
import type { IAIGateway } from "../ports/ai-gateway.port"
import type { IBacklogRepository } from "../ports/backlog-repository.port"
import type { ISessionStore } from "../ports/session-store.port"

export class SprintAlreadyPlannedError extends Error {
  constructor(name: string) {
    super(`${name} のスプリントはすでにあります`)
    this.name = "SprintAlreadyPlannedError"
  }
}

export class ProposeSprintPlanUseCase {
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
  }): Promise<CoachSession> {
    const now = input.now ?? new Date()
    const { start } = sprintRange(now, this.settings.sprint)
    const name = formatSprintName(start)
    const existing = await this.backlog.findSprintByName(name)
    if (existing) {
      throw new SprintAlreadyPlannedError(name)
    }

    const pbis = await this.backlog.listPbis()
    const candidates = pbis
      .filter((pbi) => pbi.status !== "Done")
      .map((pbi) => ({
        ...pbi,
        isCarryOver: pbi.status === "Sprint" || pbi.status === "Doing",
      }))

    const plan = selectSprintItems(candidates, this.settings, start)
    const goalRaw = await this.ai.generate(
      [
        createMessage(
          "user",
          `選定PBI:\n${plan.items.map((item) => `- ${item.title} (${item.estimateHours}h)`).join("\n")}`,
        ),
      ],
      {
        model: this.settings.model,
        temperature: 0.3,
        jsonMode: true,
        systemPrompt: `${this.systemPrompt}\nJSON: { "goal": string }`,
      },
    )

    try {
      const parsed = JSON.parse(goalRaw) as { goal?: string }
      plan.goal = parsed.goal?.trim() || `${name} の実行に集中する`
    } catch {
      plan.goal = `${name} の実行に集中する`
    }

    const session =
      (await this.sessions.get(input.sessionId)) ??
      createEmptySession(input.sessionId)
    session.pendingPlan = plan
    session.phase = "planning_review"
    session.lastAlert = "planning"
    session.messages.push(
      createMessage(
        "assistant",
        `今週（${plan.name}）の計画案です。容量 ${plan.capacityHours}h のうち ${plan.totalHours}h を割り当てました。\nゴール: ${plan.goal}\n承認すると Notion にスプリントを作ります。`,
      ),
    )
    session.updatedAt = new Date().toISOString()
    await this.sessions.save(session)
    return session
  }
}
