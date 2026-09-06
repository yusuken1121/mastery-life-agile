import { NextRequest, NextResponse } from "next/server"
import { ApproveProposalUseCase } from "@/core/use-cases/approve-proposal.use-case"
import { approvalSchema } from "@/lib/validators/coach.schema"
import { handleRouteError } from "@/lib/route-error"
import { createSessionDeps } from "../../_lib/coach-deps"
import { createBacklogRepository } from "@/infrastructure/notion/backlog.repository"

export async function POST(req: NextRequest) {
  try {
    const body = approvalSchema.parse(await req.json())
    const deps = createSessionDeps()
    const useCase = new ApproveProposalUseCase(
      deps.sessions,
      createBacklogRepository(),
      deps.settings,
    )
    const result = await useCase.execute(body)
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    return handleRouteError(error, "/api/coach/approve")
  }
}
