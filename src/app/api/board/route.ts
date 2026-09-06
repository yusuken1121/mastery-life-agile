import { NextResponse } from "next/server"
import { ListBoardUseCase } from "@/core/use-cases/list-board.use-case"
import { handleRouteError } from "@/lib/route-error"
import { createBacklogRepository } from "@/infrastructure/notion/backlog.repository"
import { loadAppSettings } from "@/infrastructure/config/load-app-settings"
import { nowInTimeZone } from "@/core/domain/sprint-calendar"

export async function GET() {
  try {
    const settings = loadAppSettings()
    const board = await new ListBoardUseCase(
      createBacklogRepository(),
      settings,
    ).execute(nowInTimeZone(settings.timezone))
    return NextResponse.json({ success: true, data: board })
  } catch (error) {
    return handleRouteError(error, "/api/board")
  }
}
