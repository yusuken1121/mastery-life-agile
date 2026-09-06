import { NextRequest, NextResponse } from "next/server"
import { ProposeSprintPlanUseCase } from "@/core/use-cases/propose-sprint-plan.use-case"
import { planSchema } from "@/lib/validators/coach.schema"
import { handleRouteError } from "@/lib/route-error"
import { createCoachDeps } from "../../_lib/coach-deps"
import { nowInTimeZone } from "@/core/domain/sprint-calendar"

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const body = planSchema.parse(await req.json())
    const deps = createCoachDeps()
    const session = await new ProposeSprintPlanUseCase(
      deps.ai,
      deps.sessions,
      deps.backlog,
      deps.settings,
      deps.prompts.planning,
    ).execute({
      sessionId: body.sessionId,
      now: nowInTimeZone(deps.settings.timezone),
    })
    return NextResponse.json({ success: true, data: { session } })
  } catch (error) {
    return handleRouteError(error, "/api/coach/plan")
  }
}
