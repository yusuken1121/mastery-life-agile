import { NextRequest, NextResponse } from "next/server"
import { RunRetrospectiveUseCase } from "@/core/use-cases/run-retrospective.use-case"
import { retroSchema } from "@/lib/validators/coach.schema"
import { handleRouteError } from "@/lib/route-error"
import { createCoachDeps } from "../../_lib/coach-deps"
import { nowInTimeZone } from "@/core/domain/sprint-calendar"

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const body = retroSchema.parse(await req.json())
    const deps = createCoachDeps()
    const session = await new RunRetrospectiveUseCase(
      deps.ai,
      deps.sessions,
      deps.backlog,
      deps.settings,
      deps.prompts.retro,
    ).execute({
      sessionId: body.sessionId,
      notes: body.notes,
      now: nowInTimeZone(deps.settings.timezone),
    })
    return NextResponse.json({ success: true, data: { session } })
  } catch (error) {
    return handleRouteError(error, "/api/coach/retro")
  }
}
