import { createGeminiGateway } from "@/infrastructure/gemini"
import { createBacklogRepository } from "@/infrastructure/notion/backlog.repository"
import { createSessionStore } from "@/infrastructure/session/file-session.store"
import { loadAppSettings } from "@/infrastructure/config/load-app-settings"
import { loadPrompt } from "@/infrastructure/config/load-prompt"

export function createSessionDeps() {
  return {
    sessions: createSessionStore(),
    settings: loadAppSettings(),
  }
}

export function createCoachDeps() {
  return {
    ...createSessionDeps(),
    ai: createGeminiGateway(),
    backlog: createBacklogRepository(),
    prompts: {
      coach: loadPrompt("coach"),
      planning: loadPrompt("planning"),
      retro: loadPrompt("retro"),
    },
  }
}
