import type {
  NotionFieldMapping,
  NotionFieldType,
} from "./notion-field-mapping.types"

type NotionPageProperties = Record<string, unknown>

export class NotionPropertyBuilder {
  static build<TRecord>(
    record: TRecord,
    fields: Array<NotionFieldMapping<TRecord>>,
  ): NotionPageProperties {
    const properties: NotionPageProperties = {}

    for (const field of fields) {
      const value = NotionPropertyBuilder.resolveValue(record, field)
      if (NotionPropertyBuilder.isEmpty(value)) {
        if (field.optional) continue
        throw new Error(
          `Missing value for Notion property "${field.propertyName}" (type: ${field.type})`,
        )
      }
      properties[field.propertyName] = NotionPropertyBuilder.toNotionProperty(
        field.type,
        value,
        field.propertyName,
      )
    }

    return properties
  }

  private static resolveValue<TRecord>(
    record: TRecord,
    field: NotionFieldMapping<TRecord>,
  ): unknown {
    const raw =
      field.recordKey !== undefined
        ? (record as Record<string, unknown>)[field.recordKey as string]
        : undefined

    if (field.transform) {
      return field.transform(raw, record)
    }

    return raw
  }

  private static isEmpty(value: unknown): boolean {
    if (value === undefined || value === null || value === "") return true
    if (Array.isArray(value) && value.length === 0) return true
    return false
  }

  private static toNotionProperty(
    type: NotionFieldType,
    value: unknown,
    propertyName: string,
  ): unknown {
    switch (type) {
      case "title":
        return {
          title: [{ text: { content: String(value) } }],
        }
      case "rich_text":
        return {
          rich_text: [{ text: { content: String(value) } }],
        }
      case "number":
        return { number: Number(value) }
      case "date":
        if (typeof value === "object" && value !== null && "start" in value) {
          const range = value as { start: string; end?: string }
          return {
            date: {
              start: String(range.start),
              end: range.end ? String(range.end) : null,
            },
          }
        }
        return { date: { start: String(value) } }
      case "select":
        return { select: { name: String(value) } }
      case "checkbox":
        return { checkbox: Boolean(value) }
      case "url":
        return { url: String(value) }
      case "relation": {
        const ids = Array.isArray(value) ? value : [value]
        return {
          relation: ids.map((id) => ({ id: String(id) })),
        }
      }
      case "files":
        return {
          files: NotionPropertyBuilder.toFileEntries(value, propertyName),
        }
      default: {
        const _exhaustive: never = type
        throw new Error(`Unsupported Notion field type: ${_exhaustive}`)
      }
    }
  }

  private static toFileEntries(
    value: unknown,
    propertyName: string,
  ): Array<{ type: "external"; name: string; external: { url: string } }> {
    const urls = Array.isArray(value) ? value : [value]

    return urls.map((url, index) => {
      const href = String(url)
      if (!href.startsWith("https://")) {
        throw new Error(
          `Notion files property "${propertyName}" requires HTTPS URLs. Got: ${href}`,
        )
      }
      return {
        type: "external" as const,
        name: index === 0 ? "attachment" : `attachment-${index + 1}`,
        external: { url: href },
      }
    })
  }
}
