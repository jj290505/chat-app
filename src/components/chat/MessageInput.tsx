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
        <div className="p-2 md:p-4 bg-background border-t">
            <div className="max-w-4xl mx-auto space-y-2 md:space-y-3">
                {/* File Preview */}
                {selectedFile && (
                    <div className="flex items-center gap-3 p-2 bg-muted/40 rounded-xl border border-primary/20 animate-in fade-in slide-in-from-bottom-2">
                        {filePreview ? (
                            <div className="relative h-12 w-12 rounded-lg overflow-hidden border border-white/10">
                                <img src={filePreview} alt="Preview" className="h-full w-full object-cover" />
                            </div>
                        ) : (
                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                                <Paperclip className="h-5 w-5 text-primary" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate text-foreground">{selectedFile.name}</p>
                            <p className="text-[10px] text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-destructive/10 hover:text-destructive" onClick={removeFile}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}

                {/* Input Bar */}
                <div className={cn(
                    "relative flex items-end gap-2 p-2 rounded-2xl border bg-muted/20 transition-all duration-300",
                    isAiMode && "border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.1)]"
                )}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 md:h-9 md:w-9 shrink-0 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Paperclip className="h-4 w-4 md:h-5 md:w-5" />
                    </Button>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 shrink-0 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5">
                                <Smile className="h-4 w-4 md:h-5 md:w-5" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0 border-none shadow-2xl mr-4 md:mr-0 z-[100]" side="top" align="start" sideOffset={10}>
                            <EmojiPicker
                                onEmojiClick={onEmojiClick}
                                theme={Theme.DARK}
                                lazyLoadEmojis={true}
                                width={320}
                                height={400}
                                searchPlaceHolder="Search emojis..."
                            />
                        </PopoverContent>
                    </Popover>

                    <div className="flex-1 relative">
                        <textarea
                            ref={textareaRef}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={isAiMode ? "Ask AI anything (@ai)..." : "Type a message..."}
                            className="w-full bg-transparent border-none focus:ring-0 resize-none py-2 text-sm max-h-32 min-h-[40px] placeholder:text-muted-foreground/50 relative z-10"
                            rows={1}
                            onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement
                                target.style.height = "auto"
                                target.style.height = `${target.scrollHeight}px`
                            }}
                        />
                        {suggestion && (
                            <div className="absolute top-2 left-0 w-full pointer-events-none text-sm text-muted-foreground/30 py-0 px-0 z-0">
                                <span className="opacity-0 invisible">{message}</span>
                                <span>{suggestion}</span>
                                <span className="ml-2 text-[10px] bg-muted px-1 rounded border border-primary/10">Tab</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={startListening}
                            className={cn(
                                "h-8 w-8 md:h-9 md:w-9 shrink-0 rounded-xl transition-all",
                                isListening ? "text-red-500 bg-red-500/10 animate-pulse" : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                            )}
                        >
                            {isListening ? <MicOff className="h-4 w-4 md:h-5 md:w-5" /> : <Mic className="h-4 w-4 md:h-5 md:w-5" />}
                        </Button>

                        <Button
                            size="icon"
                            onClick={handleSend}
                            className={cn(
                                "h-8 w-8 md:h-9 md:w-9 shrink-0 rounded-xl transition-all",
                                (message.trim() || selectedFile) ? "bg-primary text-primary-foreground opacity-100 shadow-lg shadow-primary/20" : "bg-muted text-muted-foreground opacity-50"
                            )}
                            disabled={!message.trim() && !selectedFile}
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="ai-mode"
                                checked={isAiMode}
                                onCheckedChange={setIsAiMode}
                                className="data-[state=checked]:bg-primary"
                            />
                            <label
                                htmlFor="ai-mode"
                                className={cn(
                                    "text-xs font-medium flex items-center gap-1.5 transition-colors",
                                    isAiMode ? "text-primary" : "text-muted-foreground"
                                )}
                            >
                                <Sparkles className="h-3.5 w-3.5" />
                                AI Mode
                            </label>
                        </div>
                        {isAiMode && (
                            <span className="text-[10px] text-primary/70 animate-pulse bg-primary/5 px-2 py-0.5 rounded-full border border-primary/20">
                                Ready to stream responses
                            </span>
                        )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                        Press Enter to send
                    </span>
                </div>
            </div>
        </div>
    )
}
