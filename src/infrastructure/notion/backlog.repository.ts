import type { Client } from "@notionhq/client"
import {
  toNotionPageUrl,
  type NotionPageRef,
} from "@/core/domain/notion-page-ref"
import type { Epic, EpicProposal } from "@/core/domain/epic.entity"
import type { Pbi, PbiProposal } from "@/core/domain/pbi.entity"
import type { RetroProposal } from "@/core/domain/retrospective.entity"
import type { Sprint, SprintPlanProposal } from "@/core/domain/sprint.entity"
import type {
  IBacklogRepository,
  PbiPatch,
} from "@/core/ports/backlog-repository.port"
import { NotionClientFactory } from "./notion-client.factory"
import { NotionPropertyBuilder } from "./notion-property.builder"
import { NotionWriteError } from "./notion-write.error"
import {
  epicNotionConfig,
  pbiNotionConfig,
  retroNotionConfig,
  sprintNotionConfig,
} from "./agile.config"

const RATE_LIMIT_MS = 350

export class BacklogNotionRepository implements IBacklogRepository {
  constructor(private readonly client: Client = NotionClientFactory.create()) {}

  async listEpics(): Promise<Epic[]> {
    const pages = await this.queryAll(
      requireEnv(
        epicNotionConfig().dataSourceId,
        "NOTION_EPICS_DATA_SOURCE_ID",
      ),
    )
    return pages.map(toEpic)
  }

  async listPbis(): Promise<Pbi[]> {
    const pages = await this.queryAll(
      requireEnv(pbiNotionConfig().dataSourceId, "NOTION_PBI_DATA_SOURCE_ID"),
    )
    return pages.map(toPbi)
  }

  async listSprints(): Promise<Sprint[]> {
    const pages = await this.queryAll(
      requireEnv(
        sprintNotionConfig().dataSourceId,
        "NOTION_SPRINTS_DATA_SOURCE_ID",
      ),
    )
    return pages.map(toSprint)
  }

  async findSprintByName(name: string): Promise<Sprint | null> {
    const sprints = await this.listSprints()
    return sprints.find((sprint) => sprint.name === name) ?? null
  }

  async findByExternalId(
    kind: "epic" | "pbi" | "sprint" | "retro",
    externalId: string,
  ): Promise<string | null> {
    const dataSourceId = dataSourceIdFor(kind)
    const pages = await this.queryAll(dataSourceId, {
      property: "外部ID",
      rich_text: { equals: externalId },
    })
    return pages[0]?.id ?? null
  }

  async createEpic(
    proposal: EpicProposal,
    externalId: string,
  ): Promise<NotionPageRef> {
    return this.createPage(
      epicNotionConfig().databaseId,
      "EPICS",
      {
        ...proposal,
        status: "進行中",
        externalId,
      },
      epicNotionConfig().fields,
    )
  }

  async createPbi(
    proposal: PbiProposal,
    externalId: string,
    epicId?: string,
  ): Promise<NotionPageRef> {
    await sleep(RATE_LIMIT_MS)
    return this.createPage(
      pbiNotionConfig().databaseId,
      "PBI",
      {
        ...proposal,
        status: "Backlog",
        externalId,
        epicId,
      },
      pbiNotionConfig().fields,
    )
  }

  async updatePbi(pageId: string, patch: PbiPatch): Promise<void> {
    await sleep(RATE_LIMIT_MS)
    const properties: Record<string, unknown> = {}
    if (patch.status) {
      properties["ステータス"] = { select: { name: patch.status } }
    }
    if (patch.sprintId) {
      properties.Sprint = { relation: [{ id: patch.sprintId }] }
    }
    if (patch.scheduledDate) {
      properties["予定日"] = { date: { start: patch.scheduledDate } }
    }

    try {
      await this.client.pages.update({
        page_id: pageId,
        properties: properties as Parameters<
          Client["pages"]["update"]
        >[0]["properties"],
      })
    } catch (error) {
      throw new NotionWriteError("Failed to update PBI", error)
    }
  }

  async createSprint(plan: SprintPlanProposal): Promise<NotionPageRef> {
    return this.createPage(
      sprintNotionConfig().databaseId,
      "SPRINTS",
      {
        name: plan.name,
        goal: plan.goal,
        status: "進行中",
        startDate: plan.startDate,
        endDate: plan.endDate,
      },
      sprintNotionConfig().fields,
    )
  }

  async createRetro(proposal: RetroProposal): Promise<NotionPageRef> {
    return this.createPage(
      retroNotionConfig().databaseId,
      "RETROS",
      {
        ...proposal,
        title: `${proposal.sprintName} 振り返り`,
      },
      retroNotionConfig().fields,
    )
  }

  private async createPage<TRecord>(
    databaseId: string,
    label: string,
    record: TRecord,
    fields: Parameters<typeof NotionPropertyBuilder.build<TRecord>>[1],
  ): Promise<NotionPageRef> {
    const id = requireEnv(databaseId, `NOTION_${label}_DATABASE_ID`)
    const properties = NotionPropertyBuilder.build(record, fields)

    try {
      const response = await withRetry(() =>
        this.client.pages.create({
          parent: { database_id: id },
          properties: properties as Parameters<
            Client["pages"]["create"]
          >[0]["properties"],
        }),
      )
      return { id: response.id, url: toNotionPageUrl(response.id) }
    } catch (error) {
      throw new NotionWriteError(`Failed to create ${label} page`, error)
    }
  }

  private async queryAll(
    dataSourceId: string,
    filter?: Record<string, unknown>,
  ): Promise<NotionPage[]> {
    const pages: NotionPage[] = []
    let cursor: string | undefined

    do {
      const response = await withRetry(() =>
        this.client.dataSources.query({
          data_source_id: dataSourceId,
          start_cursor: cursor,
          page_size: 100,
          ...(filter ? { filter: filter as never } : {}),
        }),
      )
      pages.push(...(response.results as NotionPage[]))
      cursor = response.has_more
        ? (response.next_cursor ?? undefined)
        : undefined
      if (cursor) await sleep(RATE_LIMIT_MS)
    } while (cursor)

    return pages
  }
}

type NotionPage = {
  id: string
  url?: string
  properties: Record<string, NotionProperty>
}

type NotionProperty = {
  type?: string
  title?: Array<{ plain_text?: string }>
  rich_text?: Array<{ plain_text?: string }>
  select?: { name?: string } | null
  number?: number | null
  date?: { start?: string | null; end?: string | null } | null
  relation?: Array<{ id: string }>
}

function dataSourceIdFor(kind: "epic" | "pbi" | "sprint" | "retro"): string {
  if (kind === "epic") {
    return requireEnv(
      epicNotionConfig().dataSourceId,
      "NOTION_EPICS_DATA_SOURCE_ID",
    )
  }
  if (kind === "pbi") {
    return requireEnv(
      pbiNotionConfig().dataSourceId,
      "NOTION_PBI_DATA_SOURCE_ID",
    )
  }
  if (kind === "sprint") {
    return requireEnv(
      sprintNotionConfig().dataSourceId,
      "NOTION_SPRINTS_DATA_SOURCE_ID",
    )
  }
  return requireEnv(
    retroNotionConfig().dataSourceId,
    "NOTION_RETROS_DATA_SOURCE_ID",
  )
}

function requireEnv(value: string | undefined, envName: string): string {
  if (!value) {
    throw new Error(`${envName} が未設定です`)
  }
  return value
}

function toEpic(page: NotionPage): Epic {
  return {
    id: page.id,
    title: titleOf(page, "タイトル"),
    why: textOf(page, "Why"),
    successDefinition: textOf(page, "成功の定義"),
    status: (selectOf(page, "ステータス") as Epic["status"]) || "アイデア",
    dueDate: dateOf(page, "期限目安"),
    category: (selectOf(page, "カテゴリ") as Epic["category"]) || "その他",
    externalId: textOf(page, "外部ID"),
    url: page.url ?? toNotionPageUrl(page.id),
  }
}

function toPbi(page: NotionPage): Pbi {
  return {
    id: page.id,
    title: titleOf(page, "タイトル"),
    acceptanceCriteria: textOf(page, "完了条件"),
    estimateHours: numberOf(page, "見積時間") ?? 0,
    priority: (selectOf(page, "優先度") as Pbi["priority"]) || "中",
    status: (selectOf(page, "ステータス") as Pbi["status"]) || "Backlog",
    epicId: relationOf(page, "Epic"),
    sprintId: relationOf(page, "Sprint"),
    scheduledDate: dateOf(page, "予定日"),
    externalId: textOf(page, "外部ID"),
    url: page.url ?? toNotionPageUrl(page.id),
  }
}

function toSprint(page: NotionPage): Sprint {
  const range = page.properties["期間"]?.date
  return {
    id: page.id,
    name: titleOf(page, "スプリント名"),
    startDate: range?.start ?? "",
    endDate: range?.end ?? range?.start ?? "",
    goal: textOf(page, "スプリントゴール"),
    status: (selectOf(page, "ステータス") as Sprint["status"]) || "計画中",
    url: page.url ?? toNotionPageUrl(page.id),
  }
}

function titleOf(page: NotionPage, name: string): string {
  return (
    page.properties[name]?.title
      ?.map((item) => item.plain_text ?? "")
      .join("") ?? ""
  )
}

function textOf(page: NotionPage, name: string): string {
  return (
    page.properties[name]?.rich_text
      ?.map((item) => item.plain_text ?? "")
      .join("") ?? ""
  )
}

function selectOf(page: NotionPage, name: string): string {
  return page.properties[name]?.select?.name ?? ""
}

function numberOf(page: NotionPage, name: string): number | undefined {
  return page.properties[name]?.number ?? undefined
}

function dateOf(page: NotionPage, name: string): string | undefined {
  return page.properties[name]?.date?.start ?? undefined
}

function relationOf(page: NotionPage, name: string): string | undefined {
  return page.properties[name]?.relation?.[0]?.id
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function withRetry<T>(fn: () => Promise<T>, attempt = 0): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    const status = (error as { status?: number }).status
    if (attempt < 3 && (status === 429 || status === 409)) {
      await sleep(400 * 2 ** attempt)
      return withRetry(fn, attempt + 1)
    }
    throw error
  }
}

export function createBacklogRepository(): IBacklogRepository {
  return new BacklogNotionRepository()
}
