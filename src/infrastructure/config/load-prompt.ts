import { readFileSync } from "node:fs"
import { join } from "node:path"

export type PromptName = "coach" | "planning" | "retro"

export function loadPrompt(name: PromptName): string {
  return readFileSync(
    join(process.cwd(), "config", "prompts", `${name}.md`),
    "utf8",
  )
}
