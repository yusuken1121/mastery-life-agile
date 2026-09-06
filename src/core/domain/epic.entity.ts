export const EPIC_STATUSES = ["アイデア", "進行中", "完了", "中断"] as const
export type EpicStatus = (typeof EPIC_STATUSES)[number]

export const EPIC_CATEGORIES = [
  "キャリア",
  "健康",
  "学習",
  "家庭",
  "その他",
] as const
export type EpicCategory = (typeof EPIC_CATEGORIES)[number]

export interface Epic {
  id: string
  title: string
  why: string
  successDefinition: string
  status: EpicStatus
  dueDate?: string
  category: EpicCategory
  externalId: string
  url?: string
}

export interface EpicProposal {
  title: string
  why: string
  successDefinition: string
  dueDate?: string
  category: EpicCategory
}

export function assertValidEpicProposal(proposal: EpicProposal): void {
  if (!proposal.title.trim()) {
    throw new InvalidEpicProposalError("エピックのタイトルが空です")
  }
  if (!proposal.why.trim()) {
    throw new InvalidEpicProposalError("Why（背景/意義）が空です")
  }
  if (!proposal.successDefinition.trim()) {
    throw new InvalidEpicProposalError("成功の定義が空です")
  }
}

export class InvalidEpicProposalError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "InvalidEpicProposalError"
  }
}
