"use client"

import { Button } from "@/components/ui/button"
import type { CoachSession } from "@/core/domain/coach-session.entity"
import type { ApprovalKind } from "@/core/use-cases/approve-proposal.use-case"
import { cn } from "@/lib/utils"

interface ApprovalCardProps {
  session: CoachSession
  pending: boolean
  onApprove: (kind: ApprovalKind) => void
  onReject: (kind: ApprovalKind) => void
}

export function ApprovalCard({
  session,
  pending,
  onApprove,
  onReject,
}: ApprovalCardProps) {
  const kind = pendingKind(session)
  if (!kind) return null

  return (
    <aside className="approval-card relative overflow-hidden rounded-sm border border-[var(--seal)]/30 bg-[var(--paper-raised)] p-5 shadow-[4px_6px_0_rgba(26,44,40,0.08)]">
      <p className="font-display text-lg tracking-wide">確認してから押印</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Notion には、あなたが承認した内容だけを書きます。
      </p>
      <div className="mt-4 space-y-3 text-sm">
        {session.pendingEpic ? (
          <ProposalBlock
            title={session.pendingEpic.title}
            lines={[
              session.pendingEpic.why,
              `成功: ${session.pendingEpic.successDefinition}`,
              session.pendingEpic.dueDate
                ? `期限: ${session.pendingEpic.dueDate}`
                : "",
            ]}
          />
        ) : null}
        {session.pendingPbis?.map((pbi) => (
          <ProposalBlock
            key={pbi.title}
            title={`${pbi.title}${pbi.tooLarge ? "（要分割）" : ""}`}
            lines={[
              pbi.acceptanceCriteria,
              `${pbi.estimateHours}h / 優先度 ${pbi.priority}`,
            ]}
          />
        ))}
        {session.pendingPlan ? (
          <ProposalBlock
            title={session.pendingPlan.name}
            lines={[
              session.pendingPlan.goal,
              `${session.pendingPlan.totalHours}h / 容量 ${session.pendingPlan.capacityHours}h`,
              ...session.pendingPlan.items.map(
                (item) =>
                  `${item.scheduledDate} ${item.title} (${item.estimateHours}h)`,
              ),
            ]}
          />
        ) : null}
        {session.pendingRetro ? (
          <ProposalBlock
            title={`${session.pendingRetro.sprintName} 振り返り`}
            lines={[
              `完了率 ${session.pendingRetro.completionRate}%`,
              `Keep: ${session.pendingRetro.keep}`,
              `Problem: ${session.pendingRetro.problem}`,
              `Try: ${session.pendingRetro.tryNext}`,
            ]}
          />
        ) : null}
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          disabled={pending}
          onClick={() => onReject(kind)}
        >
          差し戻す
        </Button>
        <button
          type="button"
          disabled={pending}
          onClick={() => onApprove(kind)}
          className={cn(
            "hanko relative grid h-20 w-20 place-items-center rounded-full border-4 border-[var(--seal)] text-[var(--seal)]",
            "font-display text-lg tracking-[0.2em] transition-transform hover:scale-105 disabled:opacity-50",
          )}
        >
          承認
        </button>
      </div>
    </aside>
  )
}

function pendingKind(session: CoachSession): ApprovalKind | null {
  if (session.pendingEpic) return "epic"
  if (session.pendingPbis?.length) return "pbi"
  if (session.pendingPlan) return "plan"
  if (session.pendingRetro) return "retro"
  return null
}

function ProposalBlock({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="border-l-2 border-[var(--brass)] pl-3">
      <p className="font-medium">{title}</p>
      {lines.filter(Boolean).map((line) => (
        <p key={line} className="mt-1 text-muted-foreground">
          {line}
        </p>
      ))}
    </div>
  )
}
