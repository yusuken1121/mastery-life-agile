export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface SprintCalendarSettings {
  lengthDays: number
  startWeekday: Weekday
  planningWeekday: Weekday
  planningHour: number
  retroWeekday: Weekday
  retroHour: number
}

export interface AppSettings {
  timezone: string
  model: string
  sprint: SprintCalendarSettings
  capacityHoursPerWeek: number
  estimateUnit: "hours"
  granularityHours: number
  approval: "always"
  selection: {
    priorityOrder: Array<"高" | "中" | "低">
    dailyHourCap: number
  }
}
