export const PBI_STATUSES = ["Backlog", "Sprint", "Doing", "Done"] as const
export type PbiStatus = (typeof PBI_STATUSES)[number]

export const PBI_PRIORITIES = ["高", "中", "低"] as const
export type PbiPriority = (typeof PBI_PRIORITIES)[number]

export interface Pbi {
  id: string
  title: string
  acceptanceCriteria: string
  estimateHours: number
  priority: PbiPriority
  status: PbiStatus
  epicId?: string
  sprintId?: string
  scheduledDate?: string
  dueDate?: string
  externalId: string
  url?: string
  isCarryOver?: boolean
}

export interface PbiProposal {
  title: string
  acceptanceCriteria: string
  estimateHours: number
  priority: PbiPriority
  tooLarge: boolean
}

export function assertValidPbiProposal(
  proposal: PbiProposal,
  granularityHours: number,
): void {
  if (!proposal.title.trim()) {
    throw new InvalidPbiProposalError("PBIのタイトルが空です")
  }
  if (!proposal.acceptanceCriteria.trim()) {
    throw new InvalidPbiProposalError("完了条件が空です")
  }
  if (!(proposal.estimateHours > 0)) {
    throw new InvalidPbiProposalError("見積時間は0より大きくしてください")
  }
  if (proposal.estimateHours > granularityHours && !proposal.tooLarge) {
    throw new InvalidPbiProposalError(
      `見積が${granularityHours}時間を超えるPBIは分割対象としてマークしてください`,
    )
  }
}

export class InvalidPbiProposalError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "InvalidPbiProposalError"
  }
}
