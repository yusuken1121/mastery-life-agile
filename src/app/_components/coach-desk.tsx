"use client"

import * as React from "react"
import { Send } from "lucide-react"
import axios from "axios"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ApprovalCard } from "./approval-card"
import { SprintScroll } from "./sprint-scroll"
import { VoiceButton } from "./voice-button"
import {
  useApproveProposal,
  useCoachSession,
  useCoachTurn,
  useProposePlan,
  useRejectProposal,
  useRunRetro,
} from "@/lib/api/queries/useCoach"
import { useHealth } from "@/lib/api/queries/useBoard"
import { cn } from "@/lib/utils"

export function CoachDesk() {
  const { data: session, isLoading } = useCoachSession()
  const { data: health } = useHealth()
  const turn = useCoachTurn()
  const approve = useApproveProposal()
  const reject = useRejectProposal()
  const plan = useProposePlan()
  const retro = useRunRetro()
  const [input, setInput] = React.useState("")
  const [recording, setRecording] = React.useState(false)
  const mediaRef = React.useRef<MediaRecorder | null>(null)
  const chunksRef = React.useRef<Blob[]>([])
  const bottomRef = React.useRef<HTMLDivElement>(null)

  const pending =
    turn.isPending ||
    approve.isPending ||
    reject.isPending ||
    plan.isPending ||
    retro.isPending

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [session?.messages.length, pending])

  const sendText = async () => {
    const content = input.trim()
    if (!content || pending) return
    setInput("")
    try {
      await turn.mutateAsync({ content })
    } catch (error) {
      toast.error(toErrorMessage(error))
    }
  }

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)
    chunksRef.current = []
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data)
    }
    recorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop())
      const blob = new Blob(chunksRef.current, {
        type: recorder.mimeType || "audio/webm",
      })
      const audioBase64 = await blobToBase64(blob)
      try {
        await turn.mutateAsync({
          content: input.trim(),
          audioBase64,
          audioMimeType: blob.type || "audio/webm",
        })
        setInput("")
      } catch (error) {
        toast.error(toErrorMessage(error))
      }
    }
    mediaRef.current = recorder
    recorder.start()
    setRecording(true)
  }

  const stopRecording = () => {
    mediaRef.current?.stop()
    setRecording(false)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)_300px]">
      <SprintScroll
        name={session?.pendingPlan?.name ?? health?.currentSprintName}
        planningWindow={health?.planningWindow}
        retroWindow={health?.retroWindow}
        pending={pending}
        onPlan={() => {
          plan.mutate(undefined, {
            onError: (error) => toast.error(toErrorMessage(error)),
            onSuccess: () =>
              toast.message("計画案を用意しました。押印で確定します。"),
          })
        }}
        onRetro={() => {
          retro.mutate(undefined, {
            onError: (error) => toast.error(toErrorMessage(error)),
            onSuccess: () =>
              toast.message("振り返りの草案です。押印で記録します。"),
          })
        }}
      />

      <section className="flex min-h-[70vh] flex-col">
        <header className="mb-4">
          <p className="text-[0.7rem] tracking-[0.4em] text-[var(--brass)]">
            一人アジャイル
          </p>
          <h1 className="font-display text-4xl md:text-5xl">今週の机</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            思いつきを話してください。エピックとタスクに整えてから、承認したものだけ
            Notion へ渡します。
          </p>
        </header>

        {!health?.gemini || !health?.notion ? (
          <p className="mb-4 border border-dashed border-[var(--brass)] px-3 py-2 text-sm">
            `.env.local` に GEMINI_API_KEY と NOTION_TOKEN を入れてください。
          </p>
        ) : null}

        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">机を開いています…</p>
          ) : null}
          {session?.messages
            .filter((message) => message.role !== "system")
            .map((message) => (
              <article
                key={message.id}
                className={cn(
                  "max-w-[36rem] rounded-sm px-4 py-3 text-sm leading-relaxed",
                  message.role === "user"
                    ? "ml-auto bg-[var(--ink)] text-[var(--paper)]"
                    : "bg-[var(--paper-raised)] shadow-[3px_4px_0_rgba(26,44,40,0.06)]",
                )}
              >
                {message.content}
              </article>
            ))}
          {pending ? (
            <p className="text-sm text-[var(--brass)]">考えを整理しています…</p>
          ) : null}
          <div ref={bottomRef} />
        </div>

        <form
          className="mt-4 flex items-end gap-2 border-t border-[var(--ink)]/10 pt-4"
          onSubmit={(event) => {
            event.preventDefault()
            void sendText()
          }}
        >
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="目標、悩み、やりたいことを書く。または話す。"
            className="min-h-[72px] resize-none bg-[var(--paper-raised)]"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault()
                void sendText()
              }
            }}
          />
          <VoiceButton
            recording={recording}
            onStart={() => void startRecording()}
            onStop={stopRecording}
            disabled={pending}
          />
          <Button
            type="submit"
            size="icon"
            className="h-11 w-11"
            disabled={pending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </section>

      {session ? (
        <ApprovalCard
          session={session}
          pending={pending}
          onApprove={(kind) => {
            approve.mutate(kind, {
              onError: (error) => toast.error(toErrorMessage(error)),
              onSuccess: (data) => {
                const links = data.pages
                  .map((page) => page.url)
                  .filter(Boolean)
                  .join("\n")
                toast.success(
                  data.skippedDuplicates
                    ? `登録しました（重複 ${data.skippedDuplicates} 件はスキップ）`
                    : "Notion に押印しました",
                )
                if (links) toast.message(links)
              },
            })
          }}
          onReject={(kind) => {
            reject.mutate(kind, {
              onError: (error) => toast.error(toErrorMessage(error)),
            })
          }}
        />
      ) : (
        <div />
      )}
    </div>
  )
}

function toErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as { error?: string } | undefined
    return payload?.error ?? error.message
  }
  return error instanceof Error ? error.message : "うまくいきませんでした"
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result)
      resolve(text.split(",")[1] ?? "")
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
