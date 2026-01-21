"use client"

import { useState, useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Phone, Video, Info, Loader2, Trash2, Pencil, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import MessageInput from "./MessageInput"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
    saveConversation,
    addMessageToConversation,
    listConversations,
    loadConversation,
    deleteConversation,
} from "@/services/conversation"
import { getCurrentUser } from "@/services/auth"
import { saveTrainingFeedback } from "@/services/training"

interface Message {
    id: string | number;
    sender: string;
    role: "user" | "assistant";
    content: string;
    time: string;
    sent?: boolean;
    isStreaming?: boolean;
}

export default function ChatArea() {
    const [messages, setMessages] = useState<Message[]>([
        { id: "welcome-ai", sender: "VYRA", role: "assistant", content: "Hi! I am VYRA. How can I assist you today?", time: "--:--" },
    ])
    const [isTyping, setIsTyping] = useState(false)
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
    const [userName, setUserName] = useState<string>("User")
    const [editingMessageId, setEditingMessageId] = useState<string | number | null>(null)
    const [editContent, setEditContent] = useState<string>("")
    const scrollRef = useRef<HTMLDivElement>(null)
    const conversationStartedRef = useRef(false)

    // Load user name and last conversation on component mount
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // Load user name
                const user = await getCurrentUser()
                if (user?.name) {
                    setUserName(user.name)
                }

                // Load last conversation
                const conversations = await listConversations()
                if (conversations && conversations.length > 0) {
                    const lastConversation = conversations[0]
                    setCurrentConversationId(lastConversation.id)
                    conversationStartedRef.current = true

                    // Load messages from last conversation
                    const storedMessages = await loadConversation(lastConversation.id)
                    if (storedMessages && storedMessages.length > 0) {
                        const formattedMessages: Message[] = storedMessages.map((msg) => ({
                            id: msg.id || Date.now() + Math.random(),
                            sender: msg.role === "user" ? "me" : "Nexus AI",
                            role: msg.role,
                            content: msg.content,
                            time: new Date(msg.created_at || "").toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                            }),
                        }))
                        setMessages(formattedMessages)
                    }
                }
            } catch (error) {
                console.error("Error loading initial data:", error)
            }
        }
        loadInitialData()
    }, [])

    useEffect(() => {
        // Auto-scroll to bottom when messages update
        const scrollArea = scrollRef.current
        if (scrollArea) {
            const timer = setTimeout(() => {
                const viewport = scrollArea.querySelector('[data-radix-scroll-area-viewport]')
                if (viewport) {
                    viewport.scrollTop = viewport.scrollHeight
                }
            }, 0)
            return () => clearTimeout(timer)
        }
    }, [messages, isTyping])

    const handleDeleteConversation = async () => {
        if (!currentConversationId) {
            console.error("No conversation to delete")
            return
        }

        try {
            await deleteConversation(currentConversationId)
            // Reset chat to initial state
            setMessages([
                { id: "welcome-ai", sender: "VYRA", role: "assistant", content: "Identity established. I am VYRA, your neural interface for the NEXORA Network. How may I assist you today?", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
            ])
            setCurrentConversationId(null)
            conversationStartedRef.current = false
            console.log("Conversation deleted successfully")
        } catch (error) {
            console.error("Error deleting conversation:", error)
        }
    }

    const handleSendMessage = async (content: string, isAiMode: boolean) => {
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        const userMessage: Message = {
            id: Date.now(),
            sender: "me",
            role: "user",
            content,
            time: timestamp,
            sent: true
        }

        setMessages(prev => [...prev, userMessage])

        const shouldTriggerAi = isAiMode || content.toLowerCase().includes("@ai")

        if (shouldTriggerAi) {
            setIsTyping(true)
            try {
                // Attempt to create conversation on first AI message
                try {
                    if (!currentConversationId && !conversationStartedRef.current) {
                        conversationStartedRef.current = true
                        const conv = await saveConversation("AI Chat", [
                            {
                                role: "user",
                                content: content.replace(/@ai/gi, "").trim()
                            }
                        ])
                        setCurrentConversationId(conv.id)
                    } else if (currentConversationId) {
                        // Add user message to existing conversation
                        await addMessageToConversation(currentConversationId, {
                            role: "user",
                            content: content.replace(/@ai/gi, "").trim()
                        })
                    }
                } catch (saveError) {
                    console.warn("Could not save conversation (Guest Mode):", saveError)
                }

                // Check if message requires research
                const cleanMessage = content.replace(/@ai/gi, "").trim()
                const researchKeywords = ["latest", "news", "current", "recent", "trending", "what's", "search", "find", "research", "tell me about", "information about"]
                const requiresResearch = researchKeywords.some(keyword => cleanMessage.toLowerCase().includes(keyword))

                // Use research endpoint for queries that need current information
                const endpoint = requiresResearch ? "/api/ai/research" : "/api/ai/chat"

                const response = await fetch(endpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(
                        endpoint === "/api/ai/research"
                            ? { message: cleanMessage }
                            : {
                                messages: messages.map(m => ({ role: m.role, content: m.content })),
                                currentMessage: cleanMessage,
                                userName: userName
                            }
                    )
                })

                if (!response.ok) {
                    const data = await response.json()
                    throw new Error(data.error || "Failed to get AI response")
                }

                const aiMsgId = Date.now() + 1
                setMessages(prev => [...prev, {
                    id: aiMsgId,
                    sender: "VYRA",
                    role: "assistant",
                    content: "",
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    isStreaming: true
                }])

                const reader = response.body?.getReader()
                const decoder = new TextDecoder()
                let accumulatedContent = ""

                if (reader) {
                    setIsTyping(false)
                    while (true) {
                        const { done, value } = await reader.read()
                        if (done) break

                        const chunk = decoder.decode(value)
                        accumulatedContent += chunk

                        setMessages(prev => prev.map(m =>
                            m.id === aiMsgId ? { ...m, content: accumulatedContent } : m
                        ))
                    }

                    // Save AI response to conversation if possible
                    if (currentConversationId) {
                        try {
                            await addMessageToConversation(currentConversationId, {
                                role: "assistant",
                                content: accumulatedContent
                            })
                        } catch (saveError) {
                            console.warn("Could not save AI response:", saveError)
                        }
                    }

                    setMessages(prev => prev.map(m =>
                        m.id === aiMsgId ? { ...m, isStreaming: false } : m
                    ))
                }
            } catch (error: any) {
                console.error("AI Error:", error)
                setIsTyping(false)
            }
        }
    }

    const handleSaveCorrection = async (msgId: string | number) => {
        const msg = messages.find((m) => m.id === msgId);
        if (!msg) return;

        const success = await saveTrainingFeedback({
            prompt: messages[messages.indexOf(msg) - 1]?.content || "Unknown prompt",
            original_response: msg.content,
            corrected_response: editContent
        });

        if (success) {
            setMessages(prev => prev.map(m =>
                m.id === msgId ? { ...m, content: editContent } : m
            ));
            setEditingMessageId(null);
        }
    }

    return (
        <div className="flex flex-col h-screen w-full overflow-hidden bg-slate-950">
            {/* Chat Header */}
            <div className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-20 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Avatar className="h-11 w-11 border-2 border-primary/20 bg-primary/10 transition-transform hover:scale-105">
                            <AvatarFallback className="text-primary font-bold text-lg">VY</AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-slate-900 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="text-base font-bold tracking-tight text-white">NEXORA AI</p>
                            {!userName || userName === "User" ? (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 font-black uppercase tracking-tighter">Guest Mode</span>
                            ) : null}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <p className="text-[11px] text-green-400 font-bold uppercase tracking-widest">Online</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center gap-2 bg-white/5 p-1 rounded-full border border-white/10 mr-2">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all">
                            <Phone className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all">
                            <Video className="h-4 w-4" />
                        </Button>
                    </div>

                    <Separator orientation="vertical" className="h-6 mx-1 bg-white/10" />

                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-white/50 hover:text-white hover:bg-white/10">
                        <Info className="h-5 w-5" />
                    </Button>

                    {/* Delete Conversation Button */}
                    {currentConversationId && (
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 rounded-full text-red-400/50 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                                    title="Clear conversation"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-slate-900 border-white/10 text-white">
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-bold">Clear Conversation?</DialogTitle>
                                    <DialogDescription className="text-slate-400">
                                        This will permanently delete your chat history. This action is irreversible.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="flex gap-4 justify-end mt-6">
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="border-white/10 text-white hover:bg-white/5">Abort</Button>
                                    </DialogTrigger>
                                    <DialogTrigger asChild>
                                        <Button
                                            className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20"
                                            onClick={handleDeleteConversation}
                                        >
                                            Delete
                                        </Button>
                                    </DialogTrigger>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 w-full overflow-hidden bg-[radial-gradient(circle_at_50%_50%,rgba(15,23,42,1)_0%,rgba(2,6,23,1)_100%)]" ref={scrollRef}>
                <div className="max-w-4xl mx-auto space-y-10 p-8">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex items-start gap-4 animate-in duration-500",
                                msg.sender === "me" ? "flex-row-reverse" : "flex-row",
                                "slide-in-from-bottom-4 fade-in"
                            )}
                        >
                            <div className="flex-shrink-0 mt-1">
                                <Avatar className={cn(
                                    "h-10 w-10 border-2 shadow-lg transition-all",
                                    msg.sender === "me"
                                        ? "border-primary/20 bg-slate-900"
                                        : "border-blue-500/30 bg-blue-950/20"
                                )}>
                                    <AvatarFallback className={cn(
                                        "text-xs font-bold",
                                        msg.sender === "me" ? "text-primary" : "text-blue-400"
                                    )}>
                                        {msg.sender === "me" ? "ME" : "AI"}
                                    </AvatarFallback>
                                </Avatar>
                            </div>

                            <div className={cn(
                                "flex flex-col group",
                                msg.sender === "me" ? "items-end" : "items-start",
                                "max-w-[85%] md:max-w-[75%]"
                            )}>
                                <div className={cn(
                                    "relative px-5 py-4 text-[15px] leading-relaxed transition-all shadow-2xl",
                                    msg.sender === "me"
                                        ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-none shadow-primary/10"
                                        : "bg-slate-900/80 backdrop-blur-md border border-white/10 text-slate-100 rounded-2xl rounded-tl-none shadow-black/50",
                                    msg.isStreaming && "animate-pulse"
                                )}>
                                    {/* Decorative subtle corner accent for AI */}
                                    {msg.sender !== "me" && (
                                        <div className="absolute top-0 left-0 w-8 h-8 pointer-events-none opacity-50">
                                            <div className="absolute top-0 left-0 w-px h-3 bg-blue-400"></div>
                                            <div className="absolute top-0 left-0 w-3 h-px bg-blue-400"></div>
                                        </div>
                                    )}

                                    {(() => {
                                        const cleanContent = msg.content
                                            .replace(/<TOOL>[\s\S]*?<\/TOOL>/g, "")
                                            .replace(/<PARAMS>[\s\S]*?<\/PARAMS>/g, "")
                                            .trim();

                                        return (
                                            <>
                                                <div className="prose prose-invert prose-sm max-w-none [&_p]:mb-0 [&_pre]:bg-black/50 [&_pre]:border [&_pre]:border-white/10">
                                                    {editingMessageId === msg.id ? (
                                                        <textarea
                                                            className="w-full bg-slate-950/50 text-white border border-primary/30 rounded-lg p-2 text-sm focus:ring-1 focus:ring-primary/50 outline-none min-h-[100px]"
                                                            value={editContent}
                                                            onChange={(e) => setEditContent(e.target.value)}
                                                        />
                                                    ) : (
                                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                            {cleanContent}
                                                        </ReactMarkdown>
                                                    )}
                                                </div>

                                                {msg.isStreaming && (
                                                    <div className="flex gap-2 mt-4 items-center">
                                                        <div className="flex gap-1">
                                                            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                                            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                                            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                                                        </div>
                                                        <span className="text-[10px] text-primary font-bold uppercase tracking-widest opacity-60">Thinking</span>
                                                    </div>
                                                )}

                                                {/* Correction Controls */}
                                                {!msg.isStreaming && msg.sender !== "me" && (
                                                    <div className="flex gap-2 mt-3 pt-3 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {editingMessageId === msg.id ? (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    className="h-7 px-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 text-[10px] font-bold uppercase tracking-wider"
                                                                    onClick={() => handleSaveCorrection(msg.id)}
                                                                >
                                                                    <Save className="w-3 h-3 mr-1" /> Commit Correction
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-7 px-2 text-white/40 hover:text-white/60 text-[10px] font-bold uppercase tracking-wider"
                                                                    onClick={() => setEditingMessageId(null)}
                                                                >
                                                                    <X className="w-3 h-3 mr-1" /> Abort
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-7 px-2 bg-white/5 hover:bg-white/10 text-white/60 border border-white/10 text-[10px] font-bold uppercase tracking-wider"
                                                                onClick={() => {
                                                                    setEditingMessageId(msg.id);
                                                                    setEditContent(msg.content);
                                                                }}
                                                            >
                                                                <Pencil className="w-3 h-3 mr-1" /> Edit & Teach
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                                <div className="flex items-center gap-2 mt-2 px-1">
                                    <span className="text-[10px] text-slate-500 font-medium tracking-tight">
                                        {msg.time}
                                    </span>
                                    {msg.sent && msg.sender === "me" && (
                                        <div className="flex items-center gap-0.5">
                                            <div className="w-1 h-1 rounded-full bg-primary/40"></div>
                                            <span className="text-[10px] text-primary/60 font-medium">Encrypted</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex items-start gap-4 animate-in fade-in slide-in-from-left-4 duration-500">
                            <Avatar className="h-10 w-10 border-2 border-blue-500/30 bg-blue-950/20 shadow-lg">
                                <AvatarFallback className="text-blue-400 text-xs font-bold">AI</AvatarFallback>
                            </Avatar>
                            <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl rounded-tl-none px-6 py-4 shadow-xl flex items-center gap-3">
                                <div className="flex gap-1.5">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                                </div>
                                <span className="text-xs text-blue-400 font-bold uppercase tracking-widest opacity-80">AI is thinking...</span>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="relative z-20">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none -translate-y-12 h-12"></div>
                <MessageInput onSendMessage={handleSendMessage} className="flex-shrink-0" />
            </div>
        </div>
    )
}
