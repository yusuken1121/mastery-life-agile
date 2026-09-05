import React from "react"
import { PATH } from "@/constants/path"
import { LogOutIcon, Mail, MessageSquare, Settings } from "lucide-react"

export const MENU_KEYS = {
  CHAT: "chat",
  CONTACT: "contact",
  SETTINGS: "settings",
  LOGOUT: "logout",
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
    label: "Chat",
    path: PATH.HOME,
    icon: <MessageSquare className="h-5 w-5" />,
    activeColor: "text-blue-600 dark:text-blue-400",
  },
  [MENU_KEYS.CONTACT]: {
    label: "Contact",
    path: PATH.CONTACT,
    icon: <Mail className="h-5 w-5" />,
    activeColor: "text-green-600 dark:text-green-400",
  },
  [MENU_KEYS.SETTINGS]: {
    label: "Settings",
    path: PATH.SETTINGS,
    icon: <Settings className="h-4.5 w-4.5" />,
  },
  [MENU_KEYS.LOGOUT]: {
    label: "Logout",
    functionality: async () => {
      alert("Logout functionality called")
    },
    icon: <LogOutIcon />,
  },
}

export const mainSidebar: MenuKey[] = [MENU_KEYS.CHAT, MENU_KEYS.CONTACT]

export const manageSidebar: MenuKey[] = [MENU_KEYS.SETTINGS]

export const adminSidebar: MenuKey[] = []

export const footerSidebar: MenuKey[] = [MENU_KEYS.LOGOUT]
