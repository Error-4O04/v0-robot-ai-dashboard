"use client"

import { useState, useRef, useEffect } from "react"
import { Mic, MicOff, Send } from "lucide-react"

type AIStatus = "Idle" | "Listening" | "Processing" | "Speaking"

interface Message {
  role: "user" | "robot"
  content: string
}

interface ChatPanelProps {
  status: AIStatus
  onStatusChange: (status: AIStatus) => void
}

function WaveformAnimation({ type }: { type: "listening" | "speaking" }) {
  const bars = type === "listening" ? 12 : 16

  return (
    <div className="flex items-center justify-center gap-[3px] h-10 my-2">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full"
          style={{
            background:
              type === "listening"
                ? "linear-gradient(180deg, #00e5ff, #00b8d4)"
                : "linear-gradient(180deg, #00e676, #00b8d4)",
            animation:
              type === "listening"
                ? `waveform ${0.6 + Math.random() * 0.4}s ease-in-out infinite`
                : `waveform-speaking ${0.4 + Math.random() * 0.5}s ease-in-out infinite`,
            animationDelay: `${i * 0.05}s`,
            height: "8px",
          }}
        />
      ))}
    </div>
  )
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-3 py-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full bg-primary/60"
          style={{
            animation: "status-pulse 1s ease-in-out infinite",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  )
}

export function ChatPanel({ status, onStatusChange }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "robot", content: "Systems online. Hello, I am ROBO-X. How can I assist you today?" },
    { role: "user", content: "What is the weather like today?" },
    {
      role: "robot",
      content:
        "Current conditions in Tilganga, Kathmandu: 18\u00B0C with partly cloudy skies. Humidity is at 65% with light winds at 8 km/h.",
    },
    { role: "user", content: "What about the air quality?" },
    {
      role: "robot",
      content:
        "The current AQI in Tilganga is 142, which is classified as Unhealthy for Sensitive Groups. I recommend limiting prolonged outdoor activities.",
    },
  ])
  const [isListening, setIsListening] = useState(false)
  const [inputText, setInputText] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, status])

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false)
      onStatusChange("Processing")
      setTimeout(() => {
        setMessages((prev) => [...prev, { role: "user", content: "Tell me about your systems." }])
        setTimeout(() => {
          onStatusChange("Speaking")
          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              {
                role: "robot",
                content:
                  "All systems operating within normal parameters. Battery at 87%, WiFi connected with strong signal. Core temperature stable at 42\u00B0C.",
              },
            ])
            onStatusChange("Idle")
          }, 2000)
        }, 1500)
      }, 1000)
    } else {
      setIsListening(true)
      onStatusChange("Listening")
    }
  }

  const handleSend = () => {
    if (!inputText.trim()) return
    const userMsg = inputText.trim()
    setInputText("")
    setMessages((prev) => [...prev, { role: "user", content: userMsg }])
    onStatusChange("Processing")
    setTimeout(() => {
      onStatusChange("Speaking")
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: "robot",
            content: `I received your message: "${userMsg}". Processing through my AI core. All systems nominal.`,
          },
        ])
        onStatusChange("Idle")
      }, 1500)
    }, 1000)
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 neon-border rounded-xl bg-card/80 backdrop-blur-sm overflow-hidden">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-status-pulse" />
          <span
            className="text-[11px] font-bold tracking-[0.15em] text-primary uppercase"
            style={{ fontFamily: "var(--font-orbitron), monospace" }}
          >
            AI Conversation
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground font-mono">
          {messages.length} messages
        </span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] px-3.5 py-2.5 rounded-xl text-[13px] leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary/15 text-primary border border-primary/20 rounded-br-sm"
                  : "bg-secondary/60 text-surface-foreground border border-border rounded-bl-sm"
              }`}
            >
              <p className="text-[9px] font-bold tracking-widest uppercase mb-1 opacity-50">
                {msg.role === "user" ? "USER" : "ROBO-X"}
              </p>
              {msg.content}
            </div>
          </div>
        ))}

        {/* Status Animations */}
        {status === "Listening" && (
          <div className="flex justify-center">
            <div className="neon-border-bright rounded-xl px-6 py-2 bg-card/60">
              <p className="text-[10px] text-center text-primary tracking-widest mb-1">
                LISTENING...
              </p>
              <WaveformAnimation type="listening" />
            </div>
          </div>
        )}

        {status === "Processing" && (
          <div className="flex justify-start">
            <div className="bg-secondary/60 border border-border rounded-xl rounded-bl-sm px-3.5 py-2.5">
              <p className="text-[9px] font-bold tracking-widest uppercase mb-1 text-muted-foreground">
                ROBO-X
              </p>
              <TypingDots />
            </div>
          </div>
        )}

        {status === "Speaking" && (
          <div className="flex justify-center">
            <div className="neon-border-bright rounded-xl px-6 py-2 bg-card/60">
              <p className="text-[10px] text-center tracking-widest mb-1" style={{ color: "#00e676" }}>
                SPEAKING...
              </p>
              <WaveformAnimation type="speaking" />
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="px-3 py-2.5 border-t border-border bg-secondary/20">
        <div className="flex items-center gap-2">
          {/* Mic Button */}
          <button
            onClick={toggleListening}
            className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 ${
              isListening
                ? "bg-primary/20 border-2 border-primary"
                : "bg-secondary border border-border hover:border-primary/40"
            }`}
            style={
              isListening
                ? { boxShadow: "0 0 20px #00e5ff66, 0 0 40px #00e5ff33" }
                : {}
            }
            aria-label={isListening ? "Stop listening" : "Start listening"}
          >
            {isListening ? (
              <MicOff className="w-4.5 h-4.5 text-primary" />
            ) : (
              <Mic className="w-4.5 h-4.5 text-muted-foreground" />
            )}
            {isListening && (
              <div className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-20" />
            )}
          </button>

          {/* Text Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type a command..."
              className="w-full bg-secondary/50 border border-border rounded-lg px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-mono"
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="w-11 h-11 rounded-lg flex items-center justify-center bg-primary/10 border border-primary/30 hover:bg-primary/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            aria-label="Send message"
          >
            <Send className="w-4 h-4 text-primary" />
          </button>
        </div>
      </div>
    </div>
  )
}
