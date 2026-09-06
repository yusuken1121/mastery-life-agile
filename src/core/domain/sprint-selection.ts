import type { AppSettings } from "./app-settings.vo"
import type { Pbi } from "./pbi.entity"
import type { SprintPlanItem, SprintPlanProposal } from "./sprint.entity"
import { addDays, formatSprintName, toDateKey } from "./sprint-calendar"

const PRIORITY_RANK: Record<string, number> = { 高: 0, 中: 1, 低: 2 }

export function selectSprintItems(
  candidates: Pbi[],
  settings: AppSettings,
  sprintStart: Date,
): SprintPlanProposal {
  const remaining = [...candidates]
  const chosen: Pbi[] = []
  const epicCounts = new Map<string, number>()
  let usedHours = 0

  while (remaining.length > 0) {
    remaining.sort((a, b) => compareForPick(a, b, epicCounts))
    const next = remaining.find(
      (pbi) => usedHours + pbi.estimateHours <= settings.capacityHoursPerWeek,
    )
    if (!next) break

    chosen.push(next)
    usedHours += next.estimateHours
    const epicKey = next.epicId ?? "_none"
    epicCounts.set(epicKey, (epicCounts.get(epicKey) ?? 0) + 1)
    remaining.splice(remaining.indexOf(next), 1)
  }

  return {
    name: formatSprintName(sprintStart),
    startDate: toDateKey(sprintStart),
    endDate: toDateKey(addDays(sprintStart, settings.sprint.lengthDays - 1)),
    goal: "",
    items: assignDates(chosen, sprintStart, settings.selection.dailyHourCap),
    totalHours: usedHours,
    capacityHours: settings.capacityHoursPerWeek,
  }
}

function compareForPick(
  a: Pbi,
  b: Pbi,
  epicCounts: Map<string, number>,
): number {
  const priority =
    (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9)
  if (priority !== 0) return priority

  const dueA = a.dueDate ?? "9999-12-31"
  const dueB = b.dueDate ?? "9999-12-31"
  if (dueA !== dueB) return dueA.localeCompare(dueB)

  if (Boolean(a.isCarryOver) !== Boolean(b.isCarryOver)) {
    return a.isCarryOver ? -1 : 1
  }

  const epicA = epicCounts.get(a.epicId ?? "_none") ?? 0
  const epicB = epicCounts.get(b.epicId ?? "_none") ?? 0
  if (epicA !== epicB) return epicA - epicB

  return a.title.localeCompare(b.title, "ja")
}

function assignDates(
  items: Pbi[],
  sprintStart: Date,
  dailyHourCap: number,
): SprintPlanItem[] {
  let dayOffset = 0
  let usedToday = 0

  return items.map((pbi) => {
    while (
      dayOffset < 6 &&
      usedToday > 0 &&
      usedToday + pbi.estimateHours > dailyHourCap
    ) {
      dayOffset += 1
      usedToday = 0
    }

    const scheduledDate = toDateKey(addDays(sprintStart, dayOffset))
    usedToday += pbi.estimateHours

    return {
      pbiId: pbi.id,
      title: pbi.title,
      estimateHours: pbi.estimateHours,
      scheduledDate,
      reason: pbi.isCarryOver
        ? "前スプリントからの持ち越し"
        : `優先度${pbi.priority}`,
    }
  })
}
