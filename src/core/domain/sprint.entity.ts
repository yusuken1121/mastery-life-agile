export const SPRINT_STATUSES = ["計画中", "進行中", "完了"] as const
export type SprintStatus = (typeof SPRINT_STATUSES)[number]

export interface Sprint {
  id: string
  name: string
  startDate: string
  endDate: string
  goal: string
  status: SprintStatus
  url?: string
}

export interface SprintPlanItem {
  pbiId: string
  title: string
  estimateHours: number
  scheduledDate: string
  reason: string
}

export interface SprintPlanProposal {
  name: string
  startDate: string
  endDate: string
  goal: string
  items: SprintPlanItem[]
  totalHours: number
  capacityHours: number
}

export function assertValidSprintPlan(plan: SprintPlanProposal): void {
  if (!plan.items.length) {
    throw new InvalidSprintPlanError("選定されたPBIがありません")
  }
  if (plan.totalHours > plan.capacityHours) {
    throw new InvalidSprintPlanError(
      `選定量 ${plan.totalHours}h が容量 ${plan.capacityHours}h を超えています`,
    )
  }
}

export class InvalidSprintPlanError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "InvalidSprintPlanError"
  }
}
