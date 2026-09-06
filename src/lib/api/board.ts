import { apiClient } from "./apiClient"
import type { BoardSnapshot } from "@/core/use-cases/list-board.use-case"
import type { AppSettings } from "@/core/domain/app-settings.vo"

interface Envelope<T> {
  success: boolean
  data: T
}

export const boardApi = {
  get: async () => {
    const result = (await apiClient.get(
      "/api/board",
    )) as Envelope<BoardSnapshot>
    return result.data
  },
}

export const healthApi = {
  get: async () => {
    const result = (await apiClient.get("/api/health")) as Envelope<{
      gemini: boolean
      notion: boolean
      planningWindow: boolean
      retroWindow: boolean
      currentSprintName: string
      settings: AppSettings
    }>
    return result.data
  },
}
