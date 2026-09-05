"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"
import {
  SIDEBAR_CONFIG,
  mainSidebar,
  manageSidebar,
  adminSidebar,
  footerSidebar,
} from "@/constants/menuKeys"
import { cn } from "@/lib/utils"
import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { APP_CONFIG } from "@/constants/app-config"

export function AppSidebar() {
  const pathname = usePathname()

  const renderSidebarItems = (keys: typeof mainSidebar) => {
    return keys.map((key) => {
      const item = SIDEBAR_CONFIG[key]
      // Safety check
      if (!item) return null
      // Skip if no path/functionality
      if (!item.path && !item.functionality) return null

      const isActive = item.path
        ? pathname === item.path ||
          (pathname.startsWith(`${item.path}/`) && item.path !== "/")
        : false
      const exactMatch = item.path ? pathname === item.path : false

      // Use exact match for home, broader match for others if needed
      const activeState = item.path === "/" ? exactMatch : isActive

      // Prepare Icon
      let icon = item.icon
      if (React.isValidElement(icon)) {
        const iconElement = icon as React.ReactElement<{ className?: string }>
        icon = React.cloneElement(iconElement, {
          className: cn(
            iconElement.props.className,
            "transition-colors",
            activeState
              ? item.activeColor || "text-foreground"
              : "text-muted-foreground",
          ),
        })
      }

      if (item.functionality) {
        return (
          <SidebarMenuItem key={key}>
            <SidebarMenuButton
              onClick={item.functionality}
              className="h-10 hover:bg-sidebar-accent/50 hover:translate-x-1 transition-all duration-200 ease-in-out cursor-pointer"
            >
              <div className="flex items-center gap-3">
                {icon}
                <span className="font-medium text-muted-foreground">
                  {item.label}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      }

      return (
        <SidebarMenuItem key={key}>
          <SidebarMenuButton
            asChild
            isActive={activeState}
            className={cn(
              "h-10 transition-all duration-200 ease-in-out",
              activeState
                ? "bg-sidebar-accent shadow-sm"
                : "hover:bg-sidebar-accent/50 hover:translate-x-1",
            )}
          >
            <Link href={item.path!} className="flex items-center gap-3">
              {icon}
              <span
                className={cn(
                  "font-medium",
                  activeState ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {item.label}
              </span>
              {activeState && item.activeColor && (
                <div
                  className={cn(
                    "ml-auto h-1.5 w-1.5 rounded-full",
                    item.activeColor.replace("text-", "bg-"),
                  )}
                />
              )}
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )
    })
  }

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar/50 backdrop-blur-xl">
      <SidebarHeader className="p-4 border-b border-sidebar-border/50">
        <div className="flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold shadow-md">
            N
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-bold text-lg tracking-tight">
              {APP_CONFIG.APP_NAME}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
              {APP_CONFIG.APP_DESCRIPTION}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
            Create
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {renderSidebarItems(mainSidebar)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="px-2 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
            Manage
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {renderSidebarItems(manageSidebar)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {adminSidebar.length > 0 && (
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className="px-2 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
              Admin
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {renderSidebarItems(adminSidebar)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border/50">
        <SidebarMenu className="space-y-1 mb-2">
          {renderSidebarItems(footerSidebar)}
        </SidebarMenu>

        <div className="rounded-lg bg-sidebar-accent/50 p-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
              <span className="text-xs font-bold">U</span>
            </div>
            <div className="text-xs">
              <p className="font-medium">User</p>
              <p className="text-muted-foreground text-[10px]">Free Plan</p>
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
