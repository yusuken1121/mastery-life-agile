import { NextResponse } from "next/server"
import { loadAppSettings } from "@/infrastructure/config/load-app-settings"
import {
  formatSprintName,
  isPlanningWindow,
  isRetroWindow,
  nowInTimeZone,
  sprintRange,
} from "@/core/domain/sprint-calendar"

export async function GET() {
  const settings = loadAppSettings()
  const now = nowInTimeZone(settings.timezone)

  return NextResponse.json({
    success: true,
    data: {
      gemini: Boolean(process.env.GEMINI_API_KEY),
      notion: Boolean(
        process.env.NOTION_TOKEN &&
        process.env.NOTION_EPICS_DATABASE_ID &&
        process.env.NOTION_EPICS_DATA_SOURCE_ID,
      ),
      settings,
      now: now.toISOString(),
      currentSprintName: formatSprintName(
        sprintRange(now, settings.sprint).start,
      ),
      planningWindow: isPlanningWindow(now, settings.sprint),
      retroWindow: isRetroWindow(now, settings.sprint),
    },
  })
}
