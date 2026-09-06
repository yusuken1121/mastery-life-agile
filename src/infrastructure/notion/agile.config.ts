import type { EpicProposal } from "@/core/domain/epic.entity"
import type { PbiProposal } from "@/core/domain/pbi.entity"
import type { RetroProposal } from "@/core/domain/retrospective.entity"
import type { SprintPlanProposal } from "@/core/domain/sprint.entity"
import type { NotionDatabaseConfig } from "./notion-field-mapping.types"

export interface EpicNotionRecord extends EpicProposal {
  status: string
  externalId: string
}

export interface PbiNotionRecord extends PbiProposal {
  status: string
  externalId: string
  epicId?: string
  sprintId?: string
  scheduledDate?: string
}

export interface SprintNotionRecord {
  name: string
  goal: string
  status: string
  startDate: string
  endDate: string
}

export interface RetroNotionRecord extends RetroProposal {
  title: string
}

export function epicNotionConfig(): NotionDatabaseConfig<EpicNotionRecord> {
  return {
    databaseId: process.env.NOTION_EPICS_DATABASE_ID ?? "",
    dataSourceId: process.env.NOTION_EPICS_DATA_SOURCE_ID ?? "",
    fields: [
      { recordKey: "title", propertyName: "タイトル", type: "title" },
      { recordKey: "why", propertyName: "Why", type: "rich_text" },
      {
        recordKey: "successDefinition",
        propertyName: "成功の定義",
        type: "rich_text",
      },
      { recordKey: "status", propertyName: "ステータス", type: "select" },
      {
        recordKey: "dueDate",
        propertyName: "期限目安",
        type: "date",
        optional: true,
      },
      { recordKey: "category", propertyName: "カテゴリ", type: "select" },
      { recordKey: "externalId", propertyName: "外部ID", type: "rich_text" },
    ],
  }
}

export function pbiNotionConfig(): NotionDatabaseConfig<PbiNotionRecord> {
  return {
    databaseId: process.env.NOTION_PBI_DATABASE_ID ?? "",
    dataSourceId: process.env.NOTION_PBI_DATA_SOURCE_ID ?? "",
    fields: [
      { recordKey: "title", propertyName: "タイトル", type: "title" },
      {
        recordKey: "acceptanceCriteria",
        propertyName: "完了条件",
        type: "rich_text",
      },
      { recordKey: "estimateHours", propertyName: "見積時間", type: "number" },
      { recordKey: "priority", propertyName: "優先度", type: "select" },
      { recordKey: "status", propertyName: "ステータス", type: "select" },
      {
        recordKey: "epicId",
        propertyName: "Epic",
        type: "relation",
        optional: true,
      },
      {
        recordKey: "sprintId",
        propertyName: "Sprint",
        type: "relation",
        optional: true,
      },
      {
        recordKey: "scheduledDate",
        propertyName: "予定日",
        type: "date",
        optional: true,
      },
      { recordKey: "externalId", propertyName: "外部ID", type: "rich_text" },
    ],
  }
}

export function sprintNotionConfig(): NotionDatabaseConfig<SprintNotionRecord> {
  return {
    databaseId: process.env.NOTION_SPRINTS_DATABASE_ID ?? "",
    dataSourceId: process.env.NOTION_SPRINTS_DATA_SOURCE_ID ?? "",
    fields: [
      { recordKey: "name", propertyName: "スプリント名", type: "title" },
      {
        propertyName: "期間",
        type: "date",
        transform: (_value, record) => ({
          start: record.startDate,
          end: record.endDate,
        }),
      },
      {
        recordKey: "goal",
        propertyName: "スプリントゴール",
        type: "rich_text",
      },
      { recordKey: "status", propertyName: "ステータス", type: "select" },
    ],
  }
}

export function retroNotionConfig(): NotionDatabaseConfig<RetroNotionRecord> {
  return {
    databaseId: process.env.NOTION_RETROS_DATABASE_ID ?? "",
    dataSourceId: process.env.NOTION_RETROS_DATA_SOURCE_ID ?? "",
    fields: [
      { recordKey: "title", propertyName: "タイトル", type: "title" },
      {
        recordKey: "sprintId",
        propertyName: "対象Sprint",
        type: "relation",
      },
      { recordKey: "keep", propertyName: "Keep", type: "rich_text" },
      { recordKey: "problem", propertyName: "Problem", type: "rich_text" },
      { recordKey: "tryNext", propertyName: "Try", type: "rich_text" },
      { recordKey: "aiComment", propertyName: "AIコメント", type: "rich_text" },
      { recordKey: "completionRate", propertyName: "完了率", type: "number" },
    ],
  }
}
