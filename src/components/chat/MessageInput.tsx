"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Send, Sparkles, Paperclip, Smile, Mic, MicOff, X, Image as ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import EmojiPicker, { Theme } from 'emoji-picker-react'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { useRef, useEffect } from "react"

interface MessageInputProps {
    onSendMessage: (content: string, isAiMode: boolean, mediaFile?: File | null) => void;
    className?: string;
}

export default function MessageInput({ onSendMessage, className }: MessageInputProps) {
    const [message, setMessage] = useState("")
    const [isAiMode, setIsAiMode] = useState(false)
    const [isListening, setIsListening] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [filePreview, setFilePreview] = useState<string | null>(null)
    const [suggestion, setSuggestion] = useState("")
    const [isSuggesting, setIsSuggesting] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const abortControllerRef = useRef<AbortController | null>(null)

    const handleSend = () => {
        if (!message.trim() && !selectedFile) return
        onSendMessage(message, isAiMode, selectedFile)
        setMessage("")
        setSelectedFile(null)
        setFilePreview(null)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Tab" && suggestion) {
            e.preventDefault()
            setMessage(prev => prev + suggestion)
            setSuggestion("")
        } else if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const fetchSuggestion = async (text: string) => {
        if (!text || text.length < 5) {
            setSuggestion("")
            return
        }

        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }

        abortControllerRef.current = new AbortController()
        setIsSuggesting(true)

        try {
            const response = await fetch("/api/ai/suggest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
                signal: abortControllerRef.current.signal
            })

            if (response.ok) {
                const data = await response.json()
                setSuggestion(data.suggestion || "")
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.error("Fetch suggestion error:", err)
            }
        } finally {
            setIsSuggesting(false)
        }
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            if (message.trim()) {
                fetchSuggestion(message)
            } else {
                setSuggestion("")
            }
        }, 800) // Debounce 800ms

        return () => clearTimeout(timer)
    }, [message])

    const onEmojiClick = (emojiData: any) => {
        setMessage(prev => prev + emojiData.emoji)
    }

    const startListening = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert("Speech recognition is not supported in this browser.")
            return
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        const recognition = new SpeechRecognition()
        recognition.continuous = false
        recognition.interimResults = false
        recognition.lang = 'en-US'

        recognition.onstart = () => setIsListening(true)
        recognition.onend = () => setIsListening(false)
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript
            setMessage(prev => prev + (prev.length > 0 ? " " : "") + transcript)
        }

        recognition.start()
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedFile(file)
            if (file.type.startsWith('image/')) {
                const reader = new FileReader()
                reader.onloadend = () => {
                    setFilePreview(reader.result as string)
                }
                reader.readAsDataURL(file)
            } else {
                setFilePreview(null)
            }
        }
    }

    const removeFile = () => {
        setSelectedFile(null)
        setFilePreview(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    return (
        <div className="p-4 md:p-6 bg-slate-950/80 backdrop-blur-2xl border-t border-white/5">
            <div className="max-w-4xl mx-auto space-y-4">
                {/* File Preview */}
                {selectedFile && (
                    <div className="flex items-center gap-4 p-3 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-300 shadow-2xl">
                        {filePreview ? (
                            <div className="relative h-14 w-14 rounded-xl overflow-hidden border border-white/10 shadow-lg">
                                <img src={filePreview} alt="Preview" className="h-full w-full object-cover" />
                            </div>
                        ) : (
                            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-lg">
                                <Paperclip className="h-6 w-6 text-primary" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate text-white tracking-tight">{selectedFile.name}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{(selectedFile.size / 1024).toFixed(1)} KB • READY TO SEND</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-colors" onClick={removeFile}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}

                {/* Input Bar */}
                <div className={cn(
                    "relative flex items-end gap-3 p-3 rounded-[24px] border border-white/10 bg-white/5 transition-all duration-500 shadow-2xl",
                    isAiMode && "border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.15)] bg-slate-900/40"
                )}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    <div className="flex items-center gap-1 mb-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 shrink-0 rounded-2xl text-slate-400 hover:text-primary hover:bg-white/5 transition-all duration-300"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Paperclip className="h-5 w-5" />
                        </Button>

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 rounded-2xl text-slate-400 hover:text-primary hover:bg-white/5 transition-all duration-300">
                                    <Smile className="h-5 w-5" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0 border-none shadow-2xl z-[100] mb-4" side="top" align="start" sideOffset={12}>
                                <EmojiPicker
                                    onEmojiClick={onEmojiClick}
                                    theme={Theme.DARK}
                                    lazyLoadEmojis={true}
                                    width={320}
                                    height={400}
                                    searchPlaceHolder="Locate symbol..."
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="flex-1 relative mb-1">
                        <textarea
                            ref={textareaRef}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={isAiMode ? "Ask AI..." : "Type a message..."}
                            className="w-full bg-transparent border-none focus:ring-0 resize-none py-2.5 text-[15px] leading-relaxed max-h-40 min-h-[44px] text-white placeholder:text-slate-600 relative z-10 transition-all"
                            rows={1}
                            onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement
                                target.style.height = "auto"
                                target.style.height = `${target.scrollHeight}px`
                            }}
                        />
                        {suggestion && (
                            <div className="absolute top-2.5 left-0 w-full pointer-events-none text-[15px] leading-relaxed text-cyan-400/20 py-0 px-0 z-0">
                                <span className="opacity-0 invisible">{message}</span>
                                <span className="animate-in fade-in duration-700">{suggestion}</span>
                                <span className="ml-3 text-[9px] bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/20 font-bold uppercase tracking-tighter">Tab</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 mb-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={startListening}
                            className={cn(
                                "h-11 w-11 shrink-0 rounded-2xl transition-all duration-300 shadow-lg",
                                isListening
                                    ? "text-red-400 bg-red-400/10 animate-pulse border border-red-400/20"
                                    : "text-slate-400 hover:text-primary hover:bg-white/5"
                            )}
                        >
                            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                        </Button>

                        <Button
                            onClick={handleSend}
                            disabled={!message.trim() && !selectedFile}
                            className={cn(
                                "h-11 w-11 shrink-0 rounded-2xl transition-all duration-500 shadow-xl",
                                (message.trim() || selectedFile)
                                    ? "bg-primary text-primary-foreground scale-100 hover:scale-[1.05] active:scale-95 shadow-primary/30"
                                    : "bg-white/5 text-slate-700 scale-95 opacity-50"
                            )}
                            size="icon"
                        >
                            <Send className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/5 shadow-inner">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-3 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 transition-all hover:bg-white/10">
                            <Switch
                                id="ai-mode"
                                checked={isAiMode}
                                onCheckedChange={setIsAiMode}
                                className="data-[state=checked]:bg-cyan-500"
                            />
                            <label
                                htmlFor="ai-mode"
                                className={cn(
                                    "text-[11px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors cursor-pointer",
                                    isAiMode ? "text-cyan-400" : "text-slate-500"
                                )}
                            >
                                <Sparkles className={cn("h-3.5 w-3.5", isAiMode && "animate-pulse")} />
                                AI Mode
                            </label>
                        </div>
                        {isAiMode && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full animate-in zoom-in duration-500">
                                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.5)]"></div>
                                <span className="text-[9px] text-cyan-400 font-black uppercase tracking-[0.2em]">
                                    AI Ready
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                        <span className="text-[10px] font-bold uppercase tracking-widest">Online</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
                        <span className="text-[10px] font-bold uppercase tracking-widest">End-to-End Encrypted</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
