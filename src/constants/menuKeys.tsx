import React from "react"
import { PATH } from "@/constants/path"
import { Columns3, MessageSquare, Settings } from "lucide-react"

export const MENU_KEYS = {
  CHAT: "chat",
  BOARD: "board",
  SETTINGS: "settings",
} as const

export type MenuKey = (typeof MENU_KEYS)[keyof typeof MENU_KEYS]

export interface SidebarItemConfig {
  label: string
  path?: string
  functionality?: () => void | Promise<void>
  icon: React.ReactNode
  activeColor?: string
}

export const SIDEBAR_CONFIG: Record<MenuKey, SidebarItemConfig> = {
  [MENU_KEYS.CHAT]: {
    label: "机",
    path: PATH.HOME,
    icon: <MessageSquare className="h-5 w-5" />,
    activeColor: "text-[var(--seal)]",
  },
  [MENU_KEYS.BOARD]: {
    label: "壁",
    path: PATH.BOARD,
    icon: <Columns3 className="h-5 w-5" />,
    activeColor: "text-[var(--moss)]",
  },
  [MENU_KEYS.SETTINGS]: {
    label: "設定",
    path: PATH.SETTINGS,
    icon: <Settings className="h-4.5 w-4.5" />,
  },
}

export const mainSidebar: MenuKey[] = [MENU_KEYS.CHAT, MENU_KEYS.BOARD]

export const manageSidebar: MenuKey[] = [MENU_KEYS.SETTINGS]

export const adminSidebar: MenuKey[] = []

export const footerSidebar: MenuKey[] = []
