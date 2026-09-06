"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { APP_CONFIG } from "@/constants/app-config"
import { useHealth } from "@/lib/api/queries/useBoard"

export default function SettingsPage() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { data: health } = useHealth()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="container mx-auto max-w-4xl py-6">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>見た目</CardTitle>
            <CardDescription>机の明るさを切り替えます。</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <Label className="text-base">ダークモード</Label>
            <div className="flex items-center gap-2">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                size="icon"
                onClick={() => setTheme("light")}
              >
                <Sun className="h-4 w-4" />
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                size="icon"
                onClick={() => setTheme("dark")}
              >
                <Moon className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>スプリント</CardTitle>
            <CardDescription>
              日曜朝に計画、土曜夜に振り返り。容量は config/app.json
              で変更できます。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              週あたり容量: {health?.settings.capacityHoursPerWeek ?? 8} 時間
            </p>
            <p>見積単位: 時間</p>
            <p>承認: 必ず自分で押印してから Notion へ書く</p>
            <p>
              Gemini: {health?.gemini ? "接続済み" : "未設定"} / Notion:{" "}
              {health?.notion ? "接続済み" : "未設定"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{APP_CONFIG.APP_NAME}</CardTitle>
            <CardDescription>{APP_CONFIG.APP_DESCRIPTION}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Version {APP_CONFIG.APP_VERSION}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
