"use client"

import { CloudSun, Droplets, Wind, MapPin } from "lucide-react"

export function WeatherCard() {
  return (
    <div className="neon-border rounded-xl bg-card/80 backdrop-blur-sm p-3 flex flex-col gap-2 animate-float" style={{ animationDelay: "0s" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <CloudSun className="w-3.5 h-3.5 text-primary" />
          <span
            className="text-[9px] font-bold tracking-[0.15em] text-primary uppercase"
            style={{ fontFamily: "var(--font-orbitron), monospace" }}
          >
            Weather
          </span>
        </div>
        <div className="flex items-center gap-1">
          <MapPin className="w-2.5 h-2.5 text-muted-foreground" />
          <span className="text-[8px] text-muted-foreground">Tilganga</span>
        </div>
      </div>

      {/* Temperature */}
      <div className="flex items-center justify-between">
        <div>
          <p
            className="text-3xl font-bold text-foreground neon-text tracking-tight"
            style={{ fontFamily: "var(--font-orbitron), monospace" }}
          >
            18<span className="text-lg text-primary">{'\u00B0C'}</span>
          </p>
          <p className="text-[10px] text-muted-foreground">Partly Cloudy</p>
        </div>
        <div className="relative">
          <CloudSun className="w-10 h-10 text-primary/50" />
          <div
            className="absolute inset-0 blur-md"
            style={{ background: "radial-gradient(circle, #00e5ff22 0%, transparent 70%)" }}
          />
        </div>
      </div>

      {/* Details */}
      <div className="flex items-center gap-3 pt-1 border-t border-border">
        <div className="flex items-center gap-1.5">
          <Droplets className="w-3 h-3 text-accent" />
          <span className="text-[10px] text-muted-foreground">
            <span className="text-foreground font-medium">65</span>%
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Wind className="w-3 h-3 text-accent" />
          <span className="text-[10px] text-muted-foreground">
            <span className="text-foreground font-medium">8</span> km/h
          </span>
        </div>
      </div>
    </div>
  )
}
