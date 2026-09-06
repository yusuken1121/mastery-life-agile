import { NextRequest, NextResponse } from "next/server"
import { RejectProposalUseCase } from "@/core/use-cases/reject-proposal.use-case"
import { approvalSchema } from "@/lib/validators/coach.schema"
import { handleRouteError } from "@/lib/route-error"
import { createSessionDeps } from "../../_lib/coach-deps"

export async function POST(req: NextRequest) {
  try {
    const body = approvalSchema.parse(await req.json())
    const deps = createSessionDeps()
    const session = await new RejectProposalUseCase(deps.sessions).execute(body)
    return NextResponse.json({ success: true, data: { session } })
  } catch (error) {
    return handleRouteError(error, "/api/coach/reject")
  }
}
