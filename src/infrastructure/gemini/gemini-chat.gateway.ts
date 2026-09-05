/**
 * Gemini Gateway Implementation
 *
 * Concrete implementation of IAIGateway using Google's Generative AI SDK.
 * This adapter converts between our domain model and Gemini's API.
 */

import { GoogleGenerativeAI, type Content } from "@google/generative-ai"
import type { IAIGateway } from "@/core/ports/ai-gateway.port"
import type { AIGenerateOptions } from "@/core/domain/ai-generate-options.vo"
import type { Message } from "@/core/domain/message.entity"
import { GeminiClientFactory } from "./gemini.client"

/**
 * Default configuration for Gemini API
 */
const DEFAULT_MODEL = "gemini-2.0-flash-exp"
const DEFAULT_TEMPERATURE = 0.7
const DEFAULT_MAX_TOKENS = 2048

/**
 * Gemini Gateway
 *
 * Implements the IAIGateway port using Google's Generative AI SDK.
 * Handles conversion between our Message entities and Gemini's Content format.
 */
export class GeminiGateway implements IAIGateway {
  private client: GoogleGenerativeAI

  constructor(apiKey?: string) {
    this.client = GeminiClientFactory.create(apiKey)
  }

  /**
   * Convert our Message entities to Gemini's Content format
   */
  private convertMessagesToGeminiFormat(messages: Message[]): Content[] {
    return messages
      .filter((msg) => msg.role !== "system") // Gemini handles system prompts separately
      .map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }))
  }

  /**
   * Extract system prompt from messages if present
   */
  private extractSystemPrompt(messages: Message[]): string | undefined {
    const systemMessage = messages.find((msg) => msg.role === "system")
    return systemMessage?.content
  }

  /**
   * Generate a streaming response from Gemini
   *
   * @param messages - Array of conversation messages
   * @param options - Optional configuration for generation
   * @returns ReadableStream of text chunks
   */
  async generateStream(
    messages: Message[],
    options?: AIGenerateOptions,
  ): Promise<ReadableStream<string>> {
    const modelName = options?.model ?? DEFAULT_MODEL
    const systemPrompt =
      options?.systemPrompt ?? this.extractSystemPrompt(messages)

    // Configure the model
    const model = this.client.getGenerativeModel({
      model: modelName,
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: options?.temperature ?? DEFAULT_TEMPERATURE,
        maxOutputTokens: options?.maxTokens ?? DEFAULT_MAX_TOKENS,
        topP: options?.topP,
      },
    })

    // Convert messages to Gemini format
    const geminiMessages = this.convertMessagesToGeminiFormat(messages)

    // Start the chat session
    const chat = model.startChat({
      history: geminiMessages.slice(0, -1), // All messages except the last one
    })

    // Get the last user message
    const lastMessage = geminiMessages[geminiMessages.length - 1]
    if (!lastMessage) {
      throw new Error("No messages provided")
    }

    const messageText = lastMessage.parts[0]?.text
    if (!messageText) {
      throw new Error("Message content is empty")
    }

    // Send the message and get streaming response
    const result = await chat.sendMessageStream(messageText)

    // Convert Gemini's async iterable to Web ReadableStream
    return new ReadableStream<string>({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text()
            if (text) {
              controller.enqueue(text)
            }
          }
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      },
    })
  }

  /**
   * Generate a complete (non-streaming) response from Gemini
   *
   * @param messages - Array of conversation messages
   * @param options - Optional configuration for generation
   * @returns Complete response text
   */
  async generate(
    messages: Message[],
    options?: AIGenerateOptions,
  ): Promise<string> {
    const modelName = options?.model ?? DEFAULT_MODEL
    const systemPrompt =
      options?.systemPrompt ?? this.extractSystemPrompt(messages)

    // Configure the model
    const model = this.client.getGenerativeModel({
      model: modelName,
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: options?.temperature ?? DEFAULT_TEMPERATURE,
        maxOutputTokens: options?.maxTokens ?? DEFAULT_MAX_TOKENS,
        topP: options?.topP,
      },
    })

    // Convert messages to Gemini format
    const geminiMessages = this.convertMessagesToGeminiFormat(messages)

    // Start the chat session
    const chat = model.startChat({
      history: geminiMessages.slice(0, -1), // All messages except the last one
    })

    // Get the last user message
    const lastMessage = geminiMessages[geminiMessages.length - 1]
    if (!lastMessage) {
      throw new Error("No messages provided")
    }

    const messageText = lastMessage.parts[0]?.text
    if (!messageText) {
      throw new Error("Message content is empty")
    }

    // Send the message and get complete response
    const result = await chat.sendMessage(messageText)
    const response = result.response

    return response.text()
  }
}

/**
 * Factory function to create a GeminiGateway instance.
 * Call from Route Handlers (Composition Root) only.
 */
export function createGeminiGateway(apiKey?: string): IAIGateway {
  return new GeminiGateway(apiKey)
}
