import type { Epic } from "../domain/epic.entity"
import type { Pbi } from "../domain/pbi.entity"
import type { Sprint } from "../domain/sprint.entity"
import { formatSprintName, sprintRange } from "../domain/sprint-calendar"
import type { AppSettings } from "../domain/app-settings.vo"
import type { IBacklogRepository } from "../ports/backlog-repository.port"

export interface BoardSnapshot {
  currentSprintName: string
  epics: Epic[]
  pbis: Pbi[]
  sprints: Sprint[]
}

export class ListBoardUseCase {
  constructor(
    private readonly backlog: IBacklogRepository,
    private readonly settings: AppSettings,
  ) {}

  async execute(now = new Date()): Promise<BoardSnapshot> {
    const [epics, pbis, sprints] = await Promise.all([
      this.backlog.listEpics(),
      this.backlog.listPbis(),
      this.backlog.listSprints(),
    ])

    return {
      currentSprintName: formatSprintName(
        sprintRange(now, this.settings.sprint).start,
      ),
      epics,
      pbis,
      sprints,
    }
  }
}
