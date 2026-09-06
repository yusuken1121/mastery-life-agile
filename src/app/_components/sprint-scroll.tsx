"use client"

import { Button } from "@/components/ui/button"

interface SprintScrollProps {
  name?: string
  planningWindow?: boolean
  retroWindow?: boolean
  onPlan: () => void
  onRetro: () => void
  pending?: boolean
}

export function SprintScroll({
  name,
  planningWindow,
  retroWindow,
  onPlan,
  onRetro,
  pending,
}: SprintScrollProps) {
  return (
    <aside className="sprint-scroll flex flex-col gap-6 rounded-sm border border-[var(--ink)]/15 bg-[var(--scroll)] px-5 py-6">
      <div>
        <p className="text-[0.7rem] tracking-[0.35em] text-[var(--brass)]">
          今週の軸
        </p>
        <h2 className="font-display mt-2 text-3xl leading-none">
          {name ?? "未計画"}
        </h2>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        日曜朝に計画し、土曜夜に振り返る。週 8 時間まで。
      </p>
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant={planningWindow ? "default" : "outline"}
          onClick={onPlan}
          disabled={pending}
        >
          今週の計画を出す
        </Button>
        <Button
          type="button"
          variant={retroWindow ? "default" : "outline"}
          onClick={onRetro}
          disabled={pending}
        >
          振り返りを始める
        </Button>
      </div>
    </aside>
  )
}
