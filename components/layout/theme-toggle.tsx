"use client"

import { useTheme } from "next-themes"
import { useSyncExternalStore } from "react"

import { Switch } from "@/components/ui/switch"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useClientReady()
  const isDark = resolvedTheme === "dark"

  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-background/70 px-3 py-2">
      <div className="flex flex-col">
        <span className="text-sm font-medium">Theme</span>
        <span className="text-xs text-muted-foreground">
          {isDark ? "Dark mode" : "Light mode"}
        </span>
      </div>

      <Switch
        checked={isDark}
        disabled={!mounted}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        aria-label="Toggle dark mode"
      />
    </div>
  )
}

function subscribeToClientReady() {
  return () => {}
}

function getClientReadySnapshot() {
  return true
}

function getServerReadySnapshot() {
  return false
}

function useClientReady() {
  return useSyncExternalStore(
    subscribeToClientReady,
    getClientReadySnapshot,
    getServerReadySnapshot
  )
}
