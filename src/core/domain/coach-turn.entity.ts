import { EPIC_CATEGORIES, type EpicProposal } from "./epic.entity"
import { PBI_PRIORITIES, type PbiProposal } from "./pbi.entity"
import {
  COACH_PHASES,
  INPUT_CLASSIFICATIONS,
  type CoachPhase,
  type InputClassification,
} from "./coach-session.entity"

export interface CoachTurn {
  assistantMessage: string
  classification: InputClassification | null
  phase: CoachPhase
  epicProposal: EpicProposal | null
  pbiProposals: PbiProposal[] | null
  awaitingApproval: boolean
  relatedEpicIds: string[]
  duplicateWarnings: string[]
}

export function parseCoachTurn(raw: unknown): CoachTurn {
  if (!isRecord(raw)) {
    throw new InvalidCoachTurnError("AI応答がJSONオブジェクトではありません")
  }

  const assistantMessage = asString(raw.assistantMessage)
  if (!assistantMessage) {
    throw new InvalidCoachTurnError("assistantMessage が空です")
  }

  const phase = raw.phase
  if (
    typeof phase !== "string" ||
    !COACH_PHASES.includes(phase as CoachPhase)
  ) {
    throw new InvalidCoachTurnError("phase が不正です")
  }

  const classification = parseClassification(raw.classification)

  return {
    assistantMessage,
    classification,
    phase: phase as CoachPhase,
    epicProposal: parseEpicProposal(raw.epicProposal),
    pbiProposals: parsePbiProposals(raw.pbiProposals),
    awaitingApproval: Boolean(raw.awaitingApproval),
    relatedEpicIds: asStringArray(raw.relatedEpicIds),
    duplicateWarnings: asStringArray(raw.duplicateWarnings),
  }
}

function parseClassification(value: unknown): InputClassification | null {
  if (value == null) return null
  if (
    typeof value === "string" &&
    INPUT_CLASSIFICATIONS.includes(value as InputClassification)
  ) {
    return value as InputClassification
  }
  throw new InvalidCoachTurnError("classification が不正です")
}

function parseEpicProposal(value: unknown): EpicProposal | null {
  if (value == null) return null
  if (!isRecord(value)) {
    throw new InvalidCoachTurnError("epicProposal が不正です")
  }

  const category = value.category
  if (
    typeof category !== "string" ||
    !EPIC_CATEGORIES.includes(category as EpicProposal["category"])
  ) {
    throw new InvalidCoachTurnError("エピックのカテゴリが不正です")
  }

  return {
    title: asString(value.title),
    why: asString(value.why),
    successDefinition: asString(value.successDefinition),
    dueDate: asOptionalString(value.dueDate),
    category: category as EpicProposal["category"],
  }
}

function parsePbiProposals(value: unknown): PbiProposal[] | null {
  if (value == null) return null
  if (!Array.isArray(value)) {
    throw new InvalidCoachTurnError("pbiProposals が配列ではありません")
  }

  return value.map((item, index) => {
    if (!isRecord(item)) {
      throw new InvalidCoachTurnError(`pbiProposals[${index}] が不正です`)
    }
    const priority = item.priority
    if (
      typeof priority !== "string" ||
      !PBI_PRIORITIES.includes(priority as PbiProposal["priority"])
    ) {
      throw new InvalidCoachTurnError(
        `pbiProposals[${index}] の優先度が不正です`,
      )
    }

    return {
      title: asString(item.title),
      acceptanceCriteria: asString(item.acceptanceCriteria),
      estimateHours: Number(item.estimateHours),
      priority: priority as PbiProposal["priority"],
      tooLarge: Boolean(item.tooLarge),
    }
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === "string")
}

export class InvalidCoachTurnError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "InvalidCoachTurnError"
  }
}
