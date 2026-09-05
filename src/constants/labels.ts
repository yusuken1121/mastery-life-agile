export const FORM_KEYS = {
  NAME: "name",
  EMAIL: "email",
  ROLE: "role",
  STATUS: "status",
  PASSWORD: "password",
  PASSWORD_CONFIRMATION: "passwordConfirmation",
} as const

export const ARTICLE_FORM_KEYS = {
  TITLE: "title",
  CONTENT: "content",
} as const

export const CHAT_FORM_KEYS = {
  MESSAGE: "message",
} as const

export const FIELD_LABELS = {
  name: "氏名",
  email: "メールアドレス",
  role: "権限",
  status: "ステータス",
  password: "パスワード",
  passwordConfirmation: "パスワード（確認用）",
  title: "タイトル",
  content: "コンテンツ",
  message: "メッセージ",
} as const
