"use client"

import { useState, useEffect } from "react"

type AIStatus = "Idle" | "Listening" | "Processing" | "Speaking"

interface RobotHeaderProps {
  status: AIStatus
  robotName?: string
}

const statusConfig: Record<AIStatus, { color: string; label: string; glowColor: string }> = {
  Idle: { color: "bg-[#5a7a9a]", label: "IDLE", glowColor: "#5a7a9a" },
  Listening: { color: "bg-[#00e5ff]", label: "LISTENING", glowColor: "#00e5ff" },
  Processing: { color: "bg-[#ffab00]", label: "PROCESSING", glowColor: "#ffab00" },
  Speaking: { color: "bg-[#00e676]", label: "SPEAKING", glowColor: "#00e676" },
}

export function RobotHeader({ status, robotName = "ROBO-X" }: RobotHeaderProps) {
  const [time, setTime] = useState("")

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: "Asia/Kathmandu",
        })
      )
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  const config = statusConfig[status]

  return (
    <header className="flex items-center justify-between px-2 md:px-4 lg:px-6 py-2 md:py-3 neon-border rounded-xl bg-card/80 backdrop-blur-sm">
      {/* Robot Name */}
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        <div className="relative flex-shrink-0">
          <div
            className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center border border-primary/30"
            style={{
              background: "linear-gradient(135deg, #0d1320 0%, #111a2e 100%)",
              boxShadow: `0 0 12px ${config.glowColor}33`,
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              className="text-primary md:w-[22px] md:h-[22px]"
            >
              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M8 8h8M10 6v4M14 6v4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <rect
                x="6"
                y="14"
                width="12"
                height="8"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <circle cx="9" cy="18" r="1" fill="currentColor" />
              <circle cx="15" cy="18" r="1" fill="currentColor" />
            </svg>
          </div>
        </div>
        <div className="min-w-0">
          <h1
            className="text-base md:text-lg font-bold tracking-[0.1em] md:tracking-[0.2em] text-primary neon-text truncate"
            style={{ fontFamily: "var(--font-orbitron), monospace" }}
          >
            {robotName}
          </h1>
          <p className="text-[8px] md:text-[10px] text-muted-foreground tracking-widest uppercase">
            Humanoid AI System
          </p>
        </div>
      </div>

      {/* Status + Time */}
      <div className="flex items-center gap-1.5 md:gap-3 flex-shrink-0">
        <div className="text-right mr-0 md:mr-2 hidden sm:block">
          <p className="text-[9px] md:text-xs text-muted-foreground font-mono">{time}</p>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-lg bg-secondary/50 border border-border">
          <div className="relative">
            <div
              className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full ${config.color}`}
              style={{
                boxShadow: `0 0 8px ${config.glowColor}, 0 0 16px ${config.glowColor}66`,
              }}
            />
            {status !== "Idle" && (
              <div
                className={`absolute inset-0 w-2 h-2 md:w-2.5 md:h-2.5 rounded-full ${config.color} animate-status-pulse`}
              />
            )}
          </div>
          <span
            className="text-[8px] md:text-[10px] font-bold tracking-[0.1em] md:tracking-[0.15em]"
            style={{ color: config.glowColor }}
          >
            {config.label}
          </span>
        </div>
      </div>
    </header>
  )
}
