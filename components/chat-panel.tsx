"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Play,
  Square,
  Settings,
  ChevronDown,
} from "lucide-react"
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

interface TTSSettings {
  rate: number
  pitch: number
  voiceURI: string
  autoSpeak: boolean
}

const DEFAULT_TTS: TTSSettings = {
  rate: 1.0,
  pitch: 0.9,
  voiceURI: "",
  autoSpeak: true,
}

export function ChatPanel({ status, onStatusChange }: ChatPanelProps) {
  const [input, setInput] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [ttsSettings, setTtsSettings] = useState<TTSSettings>(DEFAULT_TTS)
  const [showTTSPanel, setShowTTSPanel] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null)
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

  // Load available voices
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return

    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices()
      setVoices(available)
      // Auto-pick a good default English voice if none selected
      if (!ttsSettings.voiceURI && available.length > 0) {
        const preferred =
          available.find(
            (v) => v.lang.startsWith("en") && v.name.includes("Google")
          ) ||
          available.find(
            (v) => v.lang.startsWith("en") && v.localService === false
          ) ||
          available.find((v) => v.lang.startsWith("en"))
        if (preferred) {
          setTtsSettings((prev) => ({ ...prev, voiceURI: preferred.voiceURI }))
        }
      }
    }

    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices
    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [ttsSettings.voiceURI])

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

  // TTS: Auto-speak the latest assistant message when streaming finishes
  useEffect(() => {
    if (
      prevStatusRef.current === "streaming" &&
      chatStatus === "ready" &&
      ttsEnabled &&
      ttsSettings.autoSpeak
    ) {
      const lastAssistant = [...messages]
        .reverse()
        .find((m) => m.role === "assistant")
      if (lastAssistant) {
        const text = getMessageText(lastAssistant)
        if (text && text !== lastSpokenRef.current) {
          lastSpokenRef.current = text
          speakText(text, lastAssistant.id)
        }
      }
    }
    prevStatusRef.current = chatStatus
  }, [chatStatus, messages, ttsEnabled, ttsSettings.autoSpeak])

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, status, interimTranscript])

  const speakText = useCallback(
    (text: string, msgId?: string) => {
      if (!("speechSynthesis" in window) || !ttsEnabled) return
      window.speechSynthesis.cancel()
      setSpeakingMsgId(null)

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = ttsSettings.rate
      utterance.pitch = ttsSettings.pitch
      utterance.volume = 1.0

      // Use selected voice
      if (ttsSettings.voiceURI) {
        const selectedVoice = voices.find(
          (v) => v.voiceURI === ttsSettings.voiceURI
        )
        if (selectedVoice) utterance.voice = selectedVoice
      }

      utterance.onstart = () => {
        onStatusChange("Speaking")
        if (msgId) setSpeakingMsgId(msgId)
      }
      utterance.onend = () => {
        if (!isListening) onStatusChange("Idle")
        setSpeakingMsgId(null)
      }
      utterance.onerror = () => {
        setSpeakingMsgId(null)
      }
      window.speechSynthesis.speak(utterance)
    },
    [ttsEnabled, ttsSettings, voices, isListening, onStatusChange]
  )

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel()
    setSpeakingMsgId(null)
    if (!isListening) onStatusChange("Idle")
  }, [isListening, onStatusChange])

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

  // Group English voices at top, then others
  const englishVoices = voices.filter((v) => v.lang.startsWith("en"))
  const otherVoices = voices.filter((v) => !v.lang.startsWith("en"))

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
        <div className="flex items-center gap-2">
          {/* TTS Settings toggle */}
          <button
            onClick={() => setShowTTSPanel(!showTTSPanel)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] transition-all ${
              showTTSPanel
                ? "bg-primary/15 text-primary border border-primary/30"
                : "text-muted-foreground hover:text-primary border border-transparent hover:border-border"
            }`}
            aria-label="TTS settings"
          >
            <Settings className="w-3 h-3" />
            <span className="hidden sm:inline">TTS</span>
            <ChevronDown
              className={`w-2.5 h-2.5 transition-transform ${showTTSPanel ? "rotate-180" : ""}`}
            />
          </button>

          {/* Global TTS toggle */}
          <button
            onClick={() => {
              setTtsEnabled(!ttsEnabled)
              if (ttsEnabled) stopSpeaking()
            }}
            className={`p-1.5 rounded-md transition-all ${
              ttsEnabled
                ? "text-primary bg-primary/10 border border-primary/20"
                : "text-muted-foreground hover:text-primary border border-transparent"
            }`}
            aria-label={ttsEnabled ? "Disable voice output" : "Enable voice output"}
          >
            {ttsEnabled ? (
              <Volume2 className="w-3.5 h-3.5" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
          </button>

          <span className="text-[10px] text-muted-foreground font-mono">
            {messages.length} msgs
          </span>
        </div>
      </div>

      {/* TTS Settings Panel */}
      {showTTSPanel && (
        <div className="px-4 py-3 border-b border-border bg-secondary/20 space-y-3">
          {/* Voice Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
              Voice
            </label>
            <select
              value={ttsSettings.voiceURI}
              onChange={(e) =>
                setTtsSettings((prev) => ({
                  ...prev,
                  voiceURI: e.target.value,
                }))
              }
              className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-[12px] text-foreground font-mono focus:outline-none focus:border-primary/50 appearance-none"
            >
              <option value="">System Default</option>
              {englishVoices.length > 0 && (
                <optgroup label="English">
                  {englishVoices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </optgroup>
              )}
              {otherVoices.length > 0 && (
                <optgroup label="Other Languages">
                  {otherVoices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Rate + Pitch sliders side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground flex items-center justify-between">
                <span>Speed</span>
                <span className="text-primary font-mono tabular-nums">
                  {ttsSettings.rate.toFixed(1)}x
                </span>
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={ttsSettings.rate}
                onChange={(e) =>
                  setTtsSettings((prev) => ({
                    ...prev,
                    rate: parseFloat(e.target.value),
                  }))
                }
                className="w-full h-1 accent-primary bg-border rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-[0_0_8px_#00e5ff66]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground flex items-center justify-between">
                <span>Pitch</span>
                <span className="text-primary font-mono tabular-nums">
                  {ttsSettings.pitch.toFixed(1)}
                </span>
              </label>
              <input
                type="range"
                min="0.2"
                max="2.0"
                step="0.1"
                value={ttsSettings.pitch}
                onChange={(e) =>
                  setTtsSettings((prev) => ({
                    ...prev,
                    pitch: parseFloat(e.target.value),
                  }))
                }
                className="w-full h-1 accent-primary bg-border rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-[0_0_8px_#00e5ff66]"
              />
            </div>
          </div>

          {/* Auto-speak toggle */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
              Auto-speak responses
            </span>
            <button
              onClick={() =>
                setTtsSettings((prev) => ({
                  ...prev,
                  autoSpeak: !prev.autoSpeak,
                }))
              }
              className={`relative w-9 h-5 rounded-full transition-colors ${
                ttsSettings.autoSpeak
                  ? "bg-primary/30 border border-primary/50"
                  : "bg-secondary border border-border"
              }`}
              aria-label="Toggle auto-speak"
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
                  ttsSettings.autoSpeak
                    ? "left-[18px] bg-primary shadow-[0_0_8px_#00e5ff66]"
                    : "left-0.5 bg-muted-foreground"
                }`}
              />
            </button>
          </div>

          {/* Test voice button */}
          <button
            onClick={() => speakText("Hello, I am ROBO-X. This is how I sound.")}
            disabled={!ttsEnabled}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold tracking-widest uppercase hover:bg-primary/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Play className="w-3 h-3" />
            Test Voice
          </button>
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3"
      >
        {messages.map((msg) => {
          const text = getMessageText(msg)
          if (!text) return null
          const isUser = msg.role === "user"
          const isSpeakingThis = speakingMsgId === msg.id

          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`group relative max-w-[85%] lg:max-w-[70%] px-3.5 py-2.5 rounded-xl text-[13px] lg:text-sm leading-relaxed ${
                  isUser
                    ? "bg-primary/15 text-primary border border-primary/20 rounded-br-sm"
                    : "bg-secondary/60 text-surface-foreground border border-border rounded-bl-sm"
                }`}
              >
                <p className="text-[9px] font-bold tracking-widest uppercase mb-1 opacity-50">
                  {isUser ? "USER" : "ROBO-X"}
                </p>
                {text}

                {/* Per-message TTS button for assistant messages */}
                {!isUser && ttsEnabled && (
                  <div className="flex items-center gap-1 mt-2 pt-1.5 border-t border-border/50">
                    {isSpeakingThis ? (
                      <button
                        onClick={stopSpeaking}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-destructive/15 border border-destructive/20 text-destructive text-[10px] tracking-wider uppercase hover:bg-destructive/25 transition-all"
                        aria-label="Stop speaking"
                      >
                        <Square className="w-2.5 h-2.5" />
                        Stop
                      </button>
                    ) : (
                      <button
                        onClick={() => speakText(text, msg.id)}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 border border-primary/15 text-primary/70 text-[10px] tracking-wider uppercase hover:bg-primary/20 hover:text-primary transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                        aria-label="Speak this message"
                      >
                        <Play className="w-2.5 h-2.5" />
                        Speak
                      </button>
                    )}
                    {isSpeakingThis && (
                      <div className="flex items-center gap-[2px] ml-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className="w-[2px] rounded-full bg-primary"
                            style={{
                              animation: `waveform-speaking ${0.4 + Math.random() * 0.4}s ease-in-out infinite`,
                              animationDelay: `${i * 0.06}s`,
                              height: "4px",
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
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
              <p
                className="text-[10px] text-center tracking-widest mb-1"
                style={{ color: "#00e676" }}
              >
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
