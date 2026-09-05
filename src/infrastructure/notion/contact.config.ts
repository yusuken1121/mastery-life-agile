import type { NotionDatabaseConfig } from "./notion-field-mapping.types"
import type { ContactSubmission } from "@/core/domain/contact-submission.entity"

export const contactNotionConfig: NotionDatabaseConfig<ContactSubmission> = {
  databaseId: process.env.NOTION_CONTACT_DATABASE_ID ?? "",
  fields: [
    { recordKey: "name", propertyName: "Name", type: "title" },
    { recordKey: "email", propertyName: "Email", type: "rich_text" },
    { recordKey: "message", propertyName: "Message", type: "rich_text" },
  ],
}
