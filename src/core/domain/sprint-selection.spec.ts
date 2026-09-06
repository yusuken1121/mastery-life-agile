import { describe, expect, it } from "vitest"
import { selectSprintItems } from "./sprint-selection"
import type { AppSettings } from "./app-settings.vo"
import type { Pbi } from "./pbi.entity"

const settings: AppSettings = {
  timezone: "Asia/Tokyo",
  model: "gemini-2.0-flash",
  sprint: {
    lengthDays: 7,
    startWeekday: 0,
    planningWeekday: 0,
    planningHour: 8,
    retroWeekday: 6,
    retroHour: 21,
  },
  capacityHoursPerWeek: 8,
  estimateUnit: "hours",
  granularityHours: 8,
  approval: "always",
  selection: {
    priorityOrder: ["高", "中", "低"],
    dailyHourCap: 2,
  },
}

function pbi(partial: Partial<Pbi> & Pick<Pbi, "id" | "title">): Pbi {
  return {
    acceptanceCriteria: "完了",
    estimateHours: 2,
    priority: "中",
    status: "Backlog",
    externalId: partial.id,
    ...partial,
  }
}

describe("selectSprintItems", () => {
  it("packs by priority then due date within capacity", () => {
    const plan = selectSprintItems(
      [
        pbi({ id: "low", title: "低い", priority: "低", estimateHours: 8 }),
        pbi({
          id: "high-late",
          title: "高い遅い",
          priority: "高",
          dueDate: "2026-12-01",
          estimateHours: 3,
        }),
        pbi({
          id: "high-soon",
          title: "高い近い",
          priority: "高",
          dueDate: "2026-09-10",
          estimateHours: 3,
        }),
        pbi({
          id: "carry",
          title: "持ち越し",
          priority: "高",
          estimateHours: 2,
          isCarryOver: true,
          dueDate: "2026-09-10",
        }),
      ],
      settings,
      new Date(2026, 7, 30),
    )

    expect(plan.totalHours).toBeLessThanOrEqual(8)
    expect(plan.items.map((item) => item.pbiId)).toEqual([
      "carry",
      "high-soon",
      "high-late",
    ])
    expect(plan.name).toMatch(/^2026-W/)
  })

  it("skips items that exceed remaining capacity", () => {
    const plan = selectSprintItems(
      [
        pbi({ id: "a", title: "A", priority: "高", estimateHours: 5 }),
        pbi({ id: "b", title: "B", priority: "高", estimateHours: 5 }),
        pbi({ id: "c", title: "C", priority: "中", estimateHours: 3 }),
      ],
      settings,
      new Date(2026, 7, 30),
    )

    expect(plan.items.map((item) => item.pbiId)).toEqual(["a", "c"])
    expect(plan.totalHours).toBe(8)
  })
})
