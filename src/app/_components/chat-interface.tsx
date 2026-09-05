"use client"

import * as React from "react"
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSendMessageStream } from "@/lib/api/queries/useChat"
import { createChatMessage } from "@/lib/chat-utils"
import type { Message } from "@/core/domain/message.entity"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export function ChatInterface() {
  // State and Mutation
  const [messages, setMessages] = React.useState<Message[]>([])
  const [inputValue, setInputValue] = React.useState("")
  const { mutateAsync: sendMessage, isPending: isLoading } =
    useSendMessageStream()
  const scrollAreaRef = React.useRef<HTMLDivElement>(null)
  const bottomRef = React.useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  React.useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isLoading])

  // Handle form submission
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!inputValue.trim() || isLoading) return

    const userContent = inputValue.trim()
    setInputValue("")

    // 1. Create and add user message immediately
    const userMessage = createChatMessage("user", userContent)
    const newHistory = [...messages, userMessage]
    setMessages(newHistory)

    try {
      // 2. Create placeholder for assistant message
      const assistantMessage = createChatMessage("assistant", "")
      setMessages((prev) => [...prev, assistantMessage])

      // 3. Call React Query mutation
      const response = await sendMessage({
        messages: newHistory,
        options: {
          model: "gemini-2.0-flash-exp", // Using the fast experimental model
          temperature: 0.7,
        },
      })

      if (!response.body) {
        throw new Error("Response body is not readable")
      }

      // 4. Read the stream
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ""

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        // Decode chunk
        const chunk = decoder.decode(value, { stream: true })
        fullContent += chunk

        // Update the last message (assistant) with accumulated content
        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1]
          // Only update if it's the assistant message we just created
          if (lastMsg.id === assistantMessage.id) {
            return [...prev.slice(0, -1), { ...lastMsg, content: fullContent }]
          }
          return prev
        })
      }
    } catch (error) {
      console.error("Failed to send message:", error)
      // You could add a toast notification here
      setMessages((prev) => [
        ...prev,
        createChatMessage("system", "Error: Failed to get response from AI."),
      ])
    }
  }

  // Handle key press (Enter to send, Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-w-4xl mx-auto w-full bg-background rounded-xl border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              AI Assistant
            </h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Online & Ready
            </p>
          </div>
        </div>
        <Badge variant="outline" className="gap-1 hidden sm:flex">
          <Sparkles className="w-3 h-3 text-orange-400" />
          Gemini 2.0 Flash
        </Badge>
      </div>

      {/* Chat Area */}
      <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
        <div className="space-y-6 max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 pt-20 opacity-50">
              <Bot className="w-16 h-16 text-muted-foreground/50" />
              <div className="space-y-1">
                <p className="font-medium text-lg">No messages yet</p>
                <p className="text-sm text-muted-foreground">
                  Start a conversation to see the magic happen.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex w-full items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
                  msg.role === "user" ? "flex-row-reverse" : "flex-row",
                )}
              >
                {/* Avatar */}
                <Avatar
                  className={cn(
                    "w-8 h-8",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted border",
                  )}
                >
                  <AvatarFallback
                    className={cn(
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted",
                    )}
                  >
                    {msg.role === "user" ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </AvatarFallback>
                  {msg.role === "assistant" && (
                    <AvatarImage src="/bot-avatar.png" />
                  )}
                </Avatar>

                {/* Message Bubble */}
                <div
                  className={cn(
                    "relative px-4 py-3 max-w-[80%] rounded-2xl text-sm shadow-sm",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-muted/50 border rounded-tl-none text-foreground",
                  )}
                >
                  {/* System messages styled differently */}
                  {msg.role === "system" ? (
                    <div className="flex items-center gap-2 text-destructive font-medium">
                      {msg.content}
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {msg.content || (
                        <span className="animate-pulse">...</span>
                      )}
                    </div>
                  )}

                  {/* Timestamp/Status */}
                  <div
                    className={cn(
                      "text-[10px] opacity-50 mt-1 w-full flex",
                      msg.role === "user"
                        ? "justify-end text-primary-foreground/70"
                        : "justify-start text-muted-foreground",
                    )}
                  >
                    {msg.createdAt.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Invisible element to scroll to */}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <Separator />

      {/* Input Area */}
      <div className="p-4 bg-background">
        <div className="max-w-3xl mx-auto relative flex items-end gap-2">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="min-h-[50px] max-h-[200px] resize-none pr-12 py-3 rounded-xl border-muted-foreground/20 focus-visible:ring-primary/20 shadow-sm"
            rows={1}
            disabled={isLoading}
          />

          <Button
            onClick={() => handleSubmit()}
            disabled={!inputValue.trim() || isLoading}
            size="icon"
            className={cn(
              "absolute right-2 bottom-2 rounded-lg transition-all duration-200",
              inputValue.trim()
                ? "opacity-100 scale-100"
                : "opacity-0 scale-90 pointer-events-none",
            )}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        <p className="text-center text-[10px] text-muted-foreground mt-3">
          AI can make mistakes. Please check important information.
        </p>
      </div>
    </div>
  )
}
