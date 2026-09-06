import { NextResponse } from "next/server"
import { z } from "zod"
import { InvalidContactSubmissionError } from "@/core/domain/contact-submission.entity"
import { InvalidMessageHistoryError } from "@/core/domain/message.validation"
import { InvalidCoachTurnError } from "@/core/domain/coach-turn.entity"
import { InvalidEpicProposalError } from "@/core/domain/epic.entity"
import { InvalidPbiProposalError } from "@/core/domain/pbi.entity"
import { InvalidSprintPlanError } from "@/core/domain/sprint.entity"
import { InvalidRetroProposalError } from "@/core/domain/retrospective.entity"
import { MissingProposalError } from "@/core/use-cases/approve-proposal.use-case"
import { SprintAlreadyPlannedError } from "@/core/use-cases/propose-sprint-plan.use-case"
import { MissingSprintError } from "@/core/use-cases/run-retrospective.use-case"

const DOMAIN_ERRORS = [
  InvalidContactSubmissionError,
  InvalidMessageHistoryError,
  InvalidCoachTurnError,
  InvalidEpicProposalError,
  InvalidPbiProposalError,
  InvalidSprintPlanError,
  InvalidRetroProposalError,
  MissingProposalError,
  SprintAlreadyPlannedError,
  MissingSprintError,
]

export function handleRouteError(
  error: unknown,
  context: string,
): NextResponse {
  console.error(`Error in ${context}:`, error)

  if (error instanceof z.ZodError) {
    const errorMessage = error.issues.map((e) => e.message).join(", ")
    return NextResponse.json(
      { error: `Validation error: ${errorMessage}` },
      { status: 400 },
    )
  }

  if (DOMAIN_ERRORS.some((ErrorClass) => error instanceof ErrorClass)) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 },
    )
  }

  return NextResponse.json(
    {
      error: error instanceof Error ? error.message : "Internal Server Error",
    },
    { status: 500 },
  )
}
