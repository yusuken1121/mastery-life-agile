"use client"

import { useBoard } from "@/lib/api/queries/useBoard"
import { Badge } from "@/components/ui/badge"

export function SprintBoard() {
  const { data, isLoading, error } = useBoard()

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">ボードを読み込んでいます…</p>
    )
  }

  if (error) {
    return (
      <p className="text-sm text-muted-foreground">
        Notion に接続できません。トークンとデータベース ID を確認してください。
      </p>
    )
  }

  const columns = ["Backlog", "Sprint", "Doing", "Done"] as const

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[0.7rem] tracking-[0.35em] text-[var(--brass)]">
          {data?.currentSprintName}
        </p>
        <h1 className="font-display text-4xl">壁</h1>
      </header>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {columns.map((status) => (
          <section
            key={status}
            className="min-h-64 rounded-sm border border-[var(--ink)]/10 bg-[var(--paper-raised)] p-3"
          >
            <h2 className="mb-3 text-xs tracking-[0.25em]">{status}</h2>
            <div className="space-y-2">
              {data?.pbis
                .filter((pbi) => pbi.status === status)
                .map((pbi) => (
                  <article
                    key={pbi.id}
                    className="border border-[var(--ink)]/10 bg-[var(--paper)] px-3 py-2"
                  >
                    <p className="text-sm font-medium">{pbi.title}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <Badge variant="outline">{pbi.priority}</Badge>
                      <Badge variant="secondary">{pbi.estimateHours}h</Badge>
                    </div>
                  </article>
                ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
