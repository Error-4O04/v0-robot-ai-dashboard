"use client"

import { Wind } from "lucide-react"

const aqiValue = 142
const aqiMax = 300

function getAQIStatus(value: number) {
  if (value <= 50) return { label: "Good", color: "#00e676" }
  if (value <= 100) return { label: "Moderate", color: "#ffab00" }
  if (value <= 150) return { label: "USG", color: "#ff6d00" }
  if (value <= 200) return { label: "Unhealthy", color: "#ff1744" }
  if (value <= 300) return { label: "V. Unhealthy", color: "#d500f9" }
  return { label: "Hazardous", color: "#880e4f" }
}

export function AQICard() {
  const status = getAQIStatus(aqiValue)
  const percentage = Math.min((aqiValue / aqiMax) * 100, 100)

  return (
    <div
      className="neon-border rounded-xl bg-card/80 backdrop-blur-sm p-3 flex flex-col gap-2 animate-float"
      style={{ animationDelay: "0.2s" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Wind className="w-3.5 h-3.5 text-primary" />
          <span
            className="text-[9px] font-bold tracking-[0.15em] text-primary uppercase"
            style={{ fontFamily: "var(--font-orbitron), monospace" }}
          >
            Air Quality
          </span>
        </div>
      </div>

      {/* AQI Value */}
      <div className="flex items-center justify-between">
        <div>
          <p
            className="text-3xl font-bold tracking-tight"
            style={{
              fontFamily: "var(--font-orbitron), monospace",
              color: status.color,
              textShadow: `0 0 8px ${status.color}88, 0 0 16px ${status.color}44`,
            }}
          >
            {aqiValue}
          </p>
          <p className="text-[10px] font-medium" style={{ color: status.color }}>
            {status.label}
          </p>
        </div>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center border-2"
          style={{
            borderColor: `${status.color}66`,
            boxShadow: `0 0 12px ${status.color}33`,
          }}
        >
          <span className="text-[10px] font-bold" style={{ color: status.color }}>
            AQI
          </span>
        </div>
      </div>

      {/* AQI Bar */}
      <div className="pt-1 border-t border-border">
        <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${percentage}%`,
              background: `linear-gradient(90deg, #00e676, #ffab00, #ff6d00, ${status.color})`,
              boxShadow: `0 0 6px ${status.color}66`,
            }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[8px] text-muted-foreground">0</span>
          <span className="text-[8px] text-muted-foreground">300+</span>
        </div>
      </div>
    </div>
  )
}
