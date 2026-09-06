import { mkdir, readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"
import type { CoachSession } from "@/core/domain/coach-session.entity"
import type { ISessionStore } from "@/core/ports/session-store.port"

export class FileSessionStore implements ISessionStore {
  constructor(private readonly dir = join(process.cwd(), "data", "sessions")) {}

  async get(id: string): Promise<CoachSession | null> {
    try {
      const raw = await readFile(this.filePath(id), "utf8")
      const parsed = JSON.parse(raw) as CoachSession
      parsed.messages = parsed.messages.map((message) => ({
        ...message,
        createdAt: new Date(message.createdAt),
      }))
      return parsed
    } catch {
      return null
    }
  }

  async save(session: CoachSession): Promise<void> {
    await mkdir(this.dir, { recursive: true })
    await writeFile(this.filePath(session.id), JSON.stringify(session, null, 2))
  }

  private filePath(id: string): string {
    const safe = id.replace(/[^a-zA-Z0-9_-]/g, "_")
    return join(this.dir, `${safe}.json`)
  }
}

export function createSessionStore(): ISessionStore {
  return new FileSessionStore()
}
