"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Mic, MicOff, Send, Volume2, VolumeX } from "lucide-react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import type { UIMessage } from "ai"

type AIStatus = "Idle" | "Listening" | "Processing" | "Speaking"

interface ChatPanelProps {
  status: AIStatus
  onStatusChange: (status: AIStatus) => void
}

function getMessageText(message: UIMessage): string {
  if (!message.parts || !Array.isArray(message.parts)) return ""
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("")
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
  const [input, setInput] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [interimTranscript, setInterimTranscript] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const lastSpokenRef = useRef<string>("")
  const prevStatusRef = useRef(status)

  const transport = useRef(
    new DefaultChatTransport({ api: "/api/chat" })
  ).current

  const { messages, sendMessage, status: chatStatus } = useChat({
    transport,
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        parts: [
          {
            type: "text",
            text: "Systems online. Hello, I am ROBO-X. How can I assist you today?",
          },
        ],
      },
    ] as UIMessage[],
  })

  // Sync AI SDK status to robot status
  useEffect(() => {
    if (chatStatus === "submitted") {
      onStatusChange("Processing")
    } else if (chatStatus === "streaming") {
      onStatusChange("Speaking")
    } else if (chatStatus === "ready" && !isListening) {
      onStatusChange("Idle")
    }
  }, [chatStatus, isListening, onStatusChange])

  // TTS: Speak the latest assistant message when streaming finishes
  useEffect(() => {
    if (
      prevStatusRef.current === "streaming" &&
      chatStatus === "ready" &&
      ttsEnabled
    ) {
      const lastAssistant = [...messages]
        .reverse()
        .find((m) => m.role === "assistant")
      if (lastAssistant) {
        const text = getMessageText(lastAssistant)
        if (text && text !== lastSpokenRef.current) {
          lastSpokenRef.current = text
          speakText(text)
        }
      }
    }
    prevStatusRef.current = chatStatus
  }, [chatStatus, messages, ttsEnabled])

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, status, interimTranscript])

  const speakText = useCallback(
    (text: string) => {
      if (!("speechSynthesis" in window) || !ttsEnabled) return
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.0
      utterance.pitch = 0.9
      utterance.volume = 1.0

      // Try to get an English voice
      const voices = window.speechSynthesis.getVoices()
      const englishVoice = voices.find(
        (v) => v.lang.startsWith("en") && v.name.includes("Google")
      ) || voices.find((v) => v.lang.startsWith("en"))
      if (englishVoice) utterance.voice = englishVoice

      utterance.onstart = () => onStatusChange("Speaking")
      utterance.onend = () => {
        if (!isListening) onStatusChange("Idle")
      }
      window.speechSynthesis.speak(utterance)
    },
    [ttsEnabled, isListening, onStatusChange]
  )

  const startListening = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ""
      let final = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += transcript
        } else {
          interim += transcript
        }
      }

      setInterimTranscript(interim)

      if (final.trim()) {
        setInterimTranscript("")
        setIsListening(false)
        recognition.stop()
        onStatusChange("Processing")
        sendMessage({ text: final.trim() })
      }
    }

    recognition.onerror = () => {
      setIsListening(false)
      setInterimTranscript("")
      onStatusChange("Idle")
    }

    recognition.onend = () => {
      setIsListening(false)
      setInterimTranscript("")
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
    onStatusChange("Listening")
  }, [onStatusChange, sendMessage])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
    setInterimTranscript("")
    onStatusChange("Idle")
  }, [onStatusChange])

  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      window.speechSynthesis?.cancel()
      startListening()
    }
  }

  const handleSend = () => {
    if (!input.trim() || chatStatus !== "ready") return
    const text = input.trim()
    setInput("")
    sendMessage({ text })
  }

  const isProcessing = chatStatus === "submitted" || chatStatus === "streaming"

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
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTtsEnabled(!ttsEnabled)}
            className="text-muted-foreground hover:text-primary transition-colors"
            aria-label={ttsEnabled ? "Disable voice output" : "Enable voice output"}
          >
            {ttsEnabled ? (
              <Volume2 className="w-3.5 h-3.5" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
          </button>
          <span className="text-[10px] text-muted-foreground font-mono">
            {messages.length} messages
          </span>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3">
        {messages.map((msg) => {
          const text = getMessageText(msg)
          if (!text) return null
          const isUser = msg.role === "user"

          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] px-3.5 py-2.5 rounded-xl text-[13px] leading-relaxed ${
                  isUser
                    ? "bg-primary/15 text-primary border border-primary/20 rounded-br-sm"
                    : "bg-secondary/60 text-surface-foreground border border-border rounded-bl-sm"
                }`}
              >
                <p className="text-[9px] font-bold tracking-widest uppercase mb-1 opacity-50">
                  {isUser ? "USER" : "ROBO-X"}
                </p>
                {text}
              </div>
            </div>
          )
        })}

        {/* Interim voice transcript */}
        {interimTranscript && (
          <div className="flex justify-end">
            <div className="max-w-[85%] px-3.5 py-2.5 rounded-xl text-[13px] leading-relaxed bg-primary/10 text-primary/70 border border-primary/10 rounded-br-sm italic">
              <p className="text-[9px] font-bold tracking-widest uppercase mb-1 opacity-50">
                HEARING...
              </p>
              {interimTranscript}
            </div>
          </div>
        )}

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

        {status === "Processing" && chatStatus === "submitted" && (
          <div className="flex justify-start">
            <div className="bg-secondary/60 border border-border rounded-xl rounded-bl-sm px-3.5 py-2.5">
              <p className="text-[9px] font-bold tracking-widest uppercase mb-1 text-muted-foreground">
                ROBO-X
              </p>
              <TypingDots />
            </div>
          </div>
        )}

        {status === "Speaking" && chatStatus === "ready" && (
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
            disabled={isProcessing}
            className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 ${
              isListening
                ? "bg-primary/20 border-2 border-primary"
                : "bg-secondary border border-border hover:border-primary/40"
            } disabled:opacity-30 disabled:cursor-not-allowed`}
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
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type a command..."
              disabled={isProcessing}
              className="w-full bg-secondary/50 border border-border rounded-lg px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-mono disabled:opacity-50"
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
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
