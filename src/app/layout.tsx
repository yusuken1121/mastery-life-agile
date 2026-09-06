import type { Metadata } from "next"
import {
  Shippori_Mincho,
  Zen_Kaku_Gothic_New,
  IBM_Plex_Mono,
} from "next/font/google"
import "./globals.css"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { AppSidebar } from "@/components/app-sidebar"
import { GlobalHeader } from "@/components/global-header"
import ReactQueryProvider from "@/providers/query-client-provider"

const display = Shippori_Mincho({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "700"],
})

const sans = Zen_Kaku_Gothic_New({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
})

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
})

export const metadata: Metadata = {
  title: "今週の机",
  description:
    "一人アジャイルの対話机。目標を分解し、承認した分だけ Notion へ。",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body
        className={`${display.variable} ${sans.variable} ${mono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <ReactQueryProvider>
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset>
                <GlobalHeader />
                <div className="flex flex-1 flex-col gap-4 p-4 md:p-8">
                  {children}
                </div>
              </SidebarInset>
            </SidebarProvider>
            <Toaster />
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
