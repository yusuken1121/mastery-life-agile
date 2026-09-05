import { GoogleGenerativeAI } from "@google/generative-ai"

export class GeminiClientFactory {
  static create(apiKey?: string): GoogleGenerativeAI {
    const key = apiKey ?? process.env.GEMINI_API_KEY

    if (!key) {
      throw new Error(
        "GEMINI_API_KEY is not set. Please provide it via environment variable or constructor parameter.",
      )
    }

    return new GoogleGenerativeAI(key)
  }
}
