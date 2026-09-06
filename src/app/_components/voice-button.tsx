"use client"

import { Mic, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface VoiceButtonProps {
  recording: boolean
  onStart: () => void
  onStop: () => void
  disabled?: boolean
}

export function VoiceButton({
  recording,
  onStart,
  onStop,
  disabled,
}: VoiceButtonProps) {
  return (
    <Button
      type="button"
      variant={recording ? "destructive" : "outline"}
      size="icon"
      aria-label={recording ? "録音を止める" : "音声で話す"}
      disabled={disabled}
      onClick={recording ? onStop : onStart}
      className={cn(
        "h-11 w-11 rounded-full border-2",
        recording && "animate-pulse",
      )}
    >
      {recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </Button>
  )
}
