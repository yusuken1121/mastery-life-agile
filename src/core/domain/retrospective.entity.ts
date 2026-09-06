export interface RetroProposal {
  sprintId: string
  sprintName: string
  keep: string
  problem: string
  tryNext: string
  aiComment: string
  completionRate: number
}

export function assertValidRetroProposal(proposal: RetroProposal): void {
  if (!proposal.sprintId) {
    throw new InvalidRetroProposalError("対象スプリントがありません")
  }
  if (
    !proposal.keep.trim() ||
    !proposal.problem.trim() ||
    !proposal.tryNext.trim()
  ) {
    throw new InvalidRetroProposalError(
      "Keep / Problem / Try をすべて埋めてください",
    )
  }
}

export class InvalidRetroProposalError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "InvalidRetroProposalError"
  }
}
