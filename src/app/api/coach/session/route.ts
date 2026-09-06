import { NextRequest, NextResponse } from "next/server"
import { GetCoachSessionUseCase } from "@/core/use-cases/get-coach-session.use-case"
import { handleRouteError } from "@/lib/route-error"
import { createSessionDeps } from "../../_lib/coach-deps"

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get("sessionId") ?? "default"
    const deps = createSessionDeps()
    const session = await new GetCoachSessionUseCase(deps.sessions).execute(
      sessionId,
    )
    return NextResponse.json({ success: true, data: { session } })
  } catch (error) {
    return handleRouteError(error, "/api/coach/session")
  }
}
