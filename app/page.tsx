"use client"

import { useState } from "react"
import { RobotHeader } from "@/components/robot-header"
import { ChatPanel } from "@/components/chat-panel"
import { WeatherCard } from "@/components/weather-card"
import { AQICard } from "@/components/aqi-card"
import { SystemCard } from "@/components/system-card"

type AIStatus = "Idle" | "Listening" | "Processing" | "Speaking"

export default function RobotDashboard() {
  const [status, setStatus] = useState<AIStatus>("Idle")

  return (
    <main className="relative flex flex-col h-dvh w-full bg-background overflow-hidden">
      {/* Subtle background grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#00e5ff 1px, transparent 1px), linear-gradient(90deg, #00e5ff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Scan line effect */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.015]"
      >
        <div
          className="w-full h-32"
          style={{
            background: "linear-gradient(180deg, transparent, #00e5ff, transparent)",
            animation: "scan-line 8s linear infinite",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full p-3 gap-3">
        {/* Top: Header */}
        <RobotHeader status={status} robotName="ROBO-X" />

        {/* Main content area: side by side on landscape, stacked on portrait */}
        <div className="flex flex-col lg:flex-row flex-1 min-h-0 gap-3">
          {/* Chat Panel (takes remaining space) */}
          <div className="flex-1 min-h-0 min-w-0 flex flex-col">
            <ChatPanel status={status} onStatusChange={setStatus} />
          </div>

          {/* Info Cards: row on portrait, column on landscape */}
          <div className="grid grid-cols-3 lg:grid-cols-1 lg:w-56 xl:w-64 gap-2 lg:overflow-y-auto">
            <WeatherCard />
            <AQICard />
            <SystemCard />
          </div>
        </div>

        {/* Bottom edge decoration */}
        <div className="flex items-center justify-center gap-2 pb-1">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          <span
            className="text-[8px] text-muted-foreground/40 tracking-[0.3em] uppercase"
            style={{ fontFamily: "var(--font-orbitron), monospace" }}
          >
            ROBO-X OS v2.4.1
          </span>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        </div>
      </div>
    </main>
  )
}
