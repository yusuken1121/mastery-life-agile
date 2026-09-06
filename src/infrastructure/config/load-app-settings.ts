import { readFileSync } from "node:fs"
import { join } from "node:path"
import type { AppSettings } from "@/core/domain/app-settings.vo"

export function loadAppSettings(): AppSettings {
  const raw = JSON.parse(
    readFileSync(join(process.cwd(), "config", "app.json"), "utf8"),
  ) as AppSettings

  const capacity = process.env.CAPACITY_HOURS_PER_WEEK
  if (capacity) {
    raw.capacityHoursPerWeek = Number(capacity)
  }

  const model = process.env.GEMINI_MODEL
  if (model) {
    raw.model = model
  }

  return raw
}
