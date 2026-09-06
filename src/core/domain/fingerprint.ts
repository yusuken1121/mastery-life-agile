export function fingerprint(prefix: string, parts: string[]): string {
  const source = `${prefix}:${parts.map((part) => part.trim().toLowerCase()).join("|")}`
  let hash = 2166136261
  for (let i = 0; i < source.length; i += 1) {
    hash ^= source.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return `${prefix}_${(hash >>> 0).toString(16)}`
}
