import { NextRequest, NextResponse } from "next/server"
import { RunRetrospectiveUseCase } from "@/core/use-cases/run-retrospective.use-case"
import { handleRouteError } from "@/lib/route-error"
import { createCoachDeps } from "../../_lib/coach-deps"
import { nowInTimeZone } from "@/core/domain/sprint-calendar"

function authorize(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  return req.headers.get("authorization") === `Bearer ${secret}`
}

export async function GET(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const deps = createCoachDeps()
    const session = await new RunRetrospectiveUseCase(
      deps.ai,
      deps.sessions,
      deps.backlog,
      deps.settings,
      deps.prompts.retro,
    ).execute({
      sessionId: "default",
      now: nowInTimeZone(deps.settings.timezone),
    })
    return NextResponse.json({ success: true, data: { sessionId: session.id } })
  } catch (error) {
    return handleRouteError(error, "/api/cron/retro")
  }
}
