import { beforeEach, describe, expect, it, vi } from "vitest"
import { SendMessageUseCase } from "./send-message.use-case"
import type { IAIGateway } from "../ports/ai-gateway.port"
import type { Message } from "../domain/message.entity"
import {
  InvalidMessageHistoryError,
  assertValidMessageHistory,
} from "../domain/message.validation"

function createMessage(
  role: Message["role"],
  content: string,
  id = crypto.randomUUID(),
): Message {
  return { id, role, content, createdAt: new Date() }
}

describe("assertValidMessageHistory", () => {
  it("accepts history with a user message", () => {
    expect(() =>
      assertValidMessageHistory([createMessage("user", "Hello")]),
    ).not.toThrow()
  })

  it("rejects empty history", () => {
    expect(() => assertValidMessageHistory([])).toThrow(
      InvalidMessageHistoryError,
    )
  })

  it("rejects history without user messages", () => {
    expect(() =>
      assertValidMessageHistory([createMessage("assistant", "Hi")]),
    ).toThrow(InvalidMessageHistoryError)
  })

  it("rejects empty user message content", () => {
    expect(() =>
      assertValidMessageHistory([createMessage("user", "   ")]),
    ).toThrow(InvalidMessageHistoryError)
  })
})

describe("SendMessageUseCase", () => {
  let mockGateway: IAIGateway

  beforeEach(() => {
    mockGateway = {
      generateStream: vi.fn().mockResolvedValue(new ReadableStream()),
      generate: vi.fn().mockResolvedValue("complete response"),
    }
  })

  it("calls gateway.generateStream on execute", async () => {
    const useCase = new SendMessageUseCase(mockGateway)
    const messages = [createMessage("user", "Hello")]

    await useCase.execute({ messages })

    expect(mockGateway.generateStream).toHaveBeenCalledWith(messages, undefined)
  })

  it("calls gateway.generate on executeNonStreaming", async () => {
    const useCase = new SendMessageUseCase(mockGateway)
    const messages = [createMessage("user", "Hello")]

    const result = await useCase.executeNonStreaming({
      messages,
      options: { temperature: 0.5 },
    })

    expect(result).toBe("complete response")
    expect(mockGateway.generate).toHaveBeenCalledWith(messages, {
      temperature: 0.5,
    })
  })

  it("does not call gateway when domain validation fails", async () => {
    const useCase = new SendMessageUseCase(mockGateway)

    await expect(useCase.execute({ messages: [] })).rejects.toThrow(
      InvalidMessageHistoryError,
    )
    expect(mockGateway.generateStream).not.toHaveBeenCalled()
  })
})
