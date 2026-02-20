"use client"

import { useState, useEffect } from "react"
import { Battery, Wifi, Cpu, Clock } from "lucide-react"

export function SystemCard() {
  const [time, setTime] = useState("")
  const [date, setDate] = useState("")

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          timeZone: "Asia/Kathmandu",
        })
      )
      setDate(
        now.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          timeZone: "Asia/Kathmandu",
        })
      )
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  const batteryLevel = 87
  const wifiStrength = "Strong"

  return (
    <div
      className="neon-border rounded-xl bg-card/80 backdrop-blur-sm p-3 lg:p-4 flex flex-col gap-2"
      style={{
        animationName: "float",
        animationDuration: "3s",
        animationTimingFunction: "ease-in-out",
        animationIterationCount: "infinite",
        animationDelay: "0.4s",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <Cpu className="w-3.5 h-3.5 text-primary" />
        <span
          className="text-[9px] font-bold tracking-[0.15em] text-primary uppercase"
          style={{ fontFamily: "var(--font-orbitron), monospace" }}
        >
          System
        </span>
      </div>

      {/* Battery */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Battery className="w-4 h-4 text-[#00e676]" />
          <div>
            <p className="text-lg font-bold text-foreground leading-none" style={{ fontFamily: "var(--font-orbitron), monospace" }}>
              {batteryLevel}<span className="text-xs text-primary">%</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Wifi className="w-3.5 h-3.5 text-[#00e676]" />
          <span className="text-[10px] text-[#00e676]">{wifiStrength}</span>
        </div>
      </div>

      {/* Time, Date, Status */}
      <div className="flex items-center justify-between pt-1 border-t border-border">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-accent" />
          <span className="text-[10px] text-foreground font-mono">{time}</span>
        </div>
        <span className="text-[10px] text-muted-foreground font-mono">{date}</span>
        <div className="flex items-center gap-1">
          <div
            className="w-1.5 h-1.5 rounded-full bg-[#00e676]"
            style={{ boxShadow: "0 0 6px #00e676" }}
          />
          <span className="text-[9px] text-[#00e676] font-bold tracking-wider">ONLINE</span>
        </div>
      </div>
    </div>
  )
}
