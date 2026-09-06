import type { SprintCalendarSettings } from "./app-settings.vo"

const DAY_MS = 24 * 60 * 60 * 1000

export function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function parseDateKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number)
  return new Date(year, (month ?? 1) - 1, day ?? 1)
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS)
}

export function startOfSprint(
  now: Date,
  settings: SprintCalendarSettings,
): Date {
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const delta = (date.getDay() - settings.startWeekday + 7) % 7
  return addDays(date, -delta)
}

export function sprintRange(
  now: Date,
  settings: SprintCalendarSettings,
): {
  start: Date
  end: Date
} {
  const start = startOfSprint(now, settings)
  const end = addDays(start, settings.lengthDays - 1)
  return { start, end }
}

export function formatSprintName(start: Date): string {
  const thursday = addDays(start, 3)
  const year = thursday.getFullYear()
  const week = isoWeekNumber(thursday)
  return `${year}-W${String(week).padStart(2, "0")}`
}

export function isoWeekNumber(date: Date): number {
  const utc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  const day = new Date(utc).getUTCDay() || 7
  const thursday = utc + (4 - day) * DAY_MS
  const yearStart = Date.UTC(new Date(thursday).getUTCFullYear(), 0, 1)
  return Math.ceil(((thursday - yearStart) / DAY_MS + 1) / 7)
}

export function isPlanningWindow(
  now: Date,
  settings: SprintCalendarSettings,
): boolean {
  return (
    now.getDay() === settings.planningWeekday &&
    now.getHours() >= settings.planningHour
  )
}

export function isRetroWindow(
  now: Date,
  settings: SprintCalendarSettings,
): boolean {
  return (
    now.getDay() === settings.retroWeekday &&
    now.getHours() >= settings.retroHour
  )
}

export function nowInTimeZone(timeZone: string, now = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now)

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0)

  return new Date(
    value("year"),
    value("month") - 1,
    value("day"),
    value("hour"),
    value("minute"),
  )
}
