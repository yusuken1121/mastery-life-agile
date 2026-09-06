import { NextRequest, NextResponse } from "next/server"
import { ContinueCoachingUseCase } from "@/core/use-cases/continue-coaching.use-case"
import { coachTurnSchema } from "@/lib/validators/coach.schema"
import { handleRouteError } from "@/lib/route-error"
import { createCoachDeps } from "../../_lib/coach-deps"

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const body = coachTurnSchema.parse(await req.json())
    const deps = createCoachDeps()
    const useCase = new ContinueCoachingUseCase(
      deps.ai,
      deps.sessions,
      deps.backlog,
      deps.settings,
      deps.prompts.coach,
    )
    const result = await useCase.execute(body)
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    return handleRouteError(error, "/api/coach/turn")
  }
}
