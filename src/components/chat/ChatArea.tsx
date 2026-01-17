"use client"

import { useState, useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Phone, Video, Info, Loader2, Trash2, MoreVertical, Brain, Plus, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import MessageInput from "./MessageInput"
import BrainManager from "./BrainManager"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
    saveConversation,
    addMessageToConversation,
    listConversations,
    loadConversation,
    deleteConversation,
} from "@/services/conversation"
import { getCurrentUser } from "@/services/auth"

interface Message {
    id: string | number;
    sender: string;
    role: "user" | "assistant";
    content: string;
    time: string;
    sent?: boolean;
    isStreaming?: boolean;
}

interface ChatAreaProps {
    conversationId?: string | null;
    onToggleSidebar?: () => void;
}

export default function ChatArea({ conversationId, onToggleSidebar }: ChatAreaProps) {
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, sender: "Nexus AI", role: "assistant", content: "Hello! I am Nexus AI. I can assist you with your conversation or provide information directly. Just mention me!", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ])
    const [isTyping, setIsTyping] = useState(false)
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
    const [userName, setUserName] = useState<string>("User")
    const [isBrainOpen, setIsBrainOpen] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const conversationStartedRef = useRef(false)

    // Load conversation when conversationId changes
    useEffect(() => {
        const loadConversationData = async () => {
            if (!conversationId) {
                // New Chat state
                setMessages([
                    { id: 1, sender: "Nexus AI", role: "assistant", content: "Hello! I am Nexus AI. I can assist you with your conversation or provide information directly. Just mention me!", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
                ])
                setCurrentConversationId(null)
                conversationStartedRef.current = false
                return
            }

            try {
                // Load user name if not set
                if (userName === "User") {
                    const user = await getCurrentUser()
                    if (user?.name) setUserName(user.name)
                }

                setCurrentConversationId(conversationId)
                conversationStartedRef.current = true

                // Load messages
                const storedMessages = await loadConversation(conversationId)
                if (storedMessages && storedMessages.length > 0) {
                    const formattedMessages: Message[] = storedMessages.map((msg) => ({
                        id: msg.id || Date.now(),
                        sender: msg.role === "user" ? "me" : "Nexus AI",
                        role: msg.role,
                        content: msg.content,
                        time: new Date(msg.created_at || "").toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        }),
                    }))
                    setMessages(formattedMessages)
                } else {
                    // Empty conversation
                    setMessages([
                        { id: 1, sender: "Nexus AI", role: "assistant", content: "Hello! This is a new conversation. How can I help you today?", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
                    ])
                }
            } catch (error) {
                console.error("Error loading conversation data:", error)
            }
        }
        loadConversationData()
    }, [conversationId])

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
                { id: 1, sender: "Nexus AI", role: "assistant", content: "Hello! I am Nexus AI. I can assist you with your conversation or provide information directly. Just mention me!", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
            ])
            setCurrentConversationId(null)
            conversationStartedRef.current = false
            console.log("Conversation deleted successfully")
        } catch (error) {
            console.error("Error deleting conversation:", error)
        }
    }

    const handleSendMessage = async (content: string, isAiMode: boolean, mediaFile?: File | null) => {
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
            console.log("[DEBUG] AI triggered, shouldTriggerAi:", shouldTriggerAi);
            setIsTyping(true)
            let actualConversationId = currentConversationId
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
                    actualConversationId = conv.id
                } else if (currentConversationId) {
                    actualConversationId = currentConversationId
                    // Add user message to existing conversation
                    await addMessageToConversation(currentConversationId, {
                        role: "user",
                        content: content.replace(/@ai/gi, "").trim()
                    })
                }

                console.log("[DEBUG] Fetching /api/ai/chat with conversationId:", actualConversationId);
                const response = await fetch("/api/ai/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        messages: messages.map(m => ({ role: m.role, content: m.content })),
                        currentMessage: content.replace(/@ai/gi, "").trim(),
                        userName: userName,
                        conversationId: actualConversationId || undefined
                    })
                })

                console.log("[DEBUG] Response status:", response.status, "ok:", response.ok);
                if (!response.ok) {
                    const data = await response.json()
                    throw new Error(data.error || "Failed to get AI response")
                }

                const aiMsgId = Date.now() + 1
                setMessages(prev => [...prev, {
                    id: aiMsgId,
                    sender: "Nexus AI",
                    role: "assistant",
                    content: "",
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    isStreaming: true
                }])

                const reader = response.body?.getReader()
                console.log("[DEBUG] Reader obtained:", !!reader);
                const decoder = new TextDecoder()
                let accumulatedContent = ""

                if (reader) {
                    try {
                        while (true) {
                            const { done, value } = await reader.read()
                            if (done) break

                            const chunk = decoder.decode(value, { stream: true })
                            accumulatedContent += chunk

                            setMessages(prev => prev.map(m =>
                                m.id === aiMsgId ? { ...m, content: accumulatedContent } : m
                            ))

                            // Hide loading indicator after first chunk
                            if (accumulatedContent.length > 0 && isTyping) {
                                setIsTyping(false)
                            }
                        }
                    } finally {
                        setIsTyping(false)
                        reader.releaseLock()
                    }

                    // Save AI response to conversation
                    if (actualConversationId) {
                        await addMessageToConversation(actualConversationId, {
                            role: "assistant",
                            content: accumulatedContent
                        })
                    }

                    setMessages(prev => prev.map(m =>
                        m.id === aiMsgId ? { ...m, isStreaming: false } : m
                    ))
                }
            } catch (error) {
                console.error("[DEBUG] AI Error:", error)
                setIsTyping(false)
            }
        }
    }

    return (
        <div className="flex flex-col h-screen w-full overflow-hidden">
            {/* Chat Header */}
            <div className="h-16 border-b flex items-center justify-between px-4 md:px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 flex-shrink-0">
                <div className="flex items-center gap-2 md:gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-xl md:hidden text-muted-foreground"
                        onClick={onToggleSidebar}
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                    <div className="h-8 w-8 md:h-9 md:w-9 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-white shadow-lg ring-2 ring-primary/20">
                        <span className="font-bold text-[10px] md:text-xs">AI</span>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-foreground/90">Nexus AI</p>
                        <p className="text-[9px] text-primary font-medium animate-pulse">Advanced Intelligence</p>
                    </div>
                </div>

                <div className="flex items-center gap-1 md:gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 rounded-full">
                        <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 rounded-full hidden sm:flex">
                        <Video className="h-4 w-4" />
                    </Button>
                    <Separator orientation="vertical" className="h-4 mx-0.5 md:mx-1 hidden sm:flex" />
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-8 w-8 md:h-9 md:w-9 rounded-full", isBrainOpen && "bg-primary/10 text-primary")}
                        onClick={() => setIsBrainOpen(!isBrainOpen)}
                    >
                        <Brain className="h-4 w-4" />
                    </Button>
                    <Separator orientation="vertical" className="h-4 mx-0.5 md:mx-1" />
                    <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 rounded-full hidden sm:flex">
                        <Info className="h-4 w-4" />
                    </Button>
                    <Separator orientation="vertical" className="h-4 mx-1" />

                    {/* More Menu - Only show when conversation exists */}
                    {currentConversationId && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                            <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                                            <span className="text-destructive">Delete Conversation</span>
                                        </DropdownMenuItem>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Delete Conversation</DialogTitle>
                                            <DialogDescription>
                                                Are you sure you want to delete this conversation? This action cannot be undone.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="flex gap-3 justify-end mt-4">
                                            <DialogTrigger asChild>
                                                <Button variant="outline">Cancel</Button>
                                            </DialogTrigger>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="destructive"
                                                    onClick={handleDeleteConversation}
                                                >
                                                    Delete
                                                </Button>
                                            </DialogTrigger>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                                <DropdownMenuItem>
                                    <Info className="mr-2 h-4 w-4" />
                                    <span>AI Settings</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Messages Area */}
                <div className="flex-1 flex flex-col min-w-0">
                    <ScrollArea className="flex-1 w-full overflow-hidden" ref={scrollRef}>
                        <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 pb-4 p-4 md:p-6">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={cn(
                                        "flex items-end gap-3",
                                        msg.sender === "me" ? "flex-row-reverse" : "flex-row"
                                    )}
                                >
                                    <Avatar className="h-8 w-8 shrink-0">
                                        <AvatarFallback>{msg.sender === "me" ? "ME" : msg.sender === "Nexus AI" ? "AI" : msg.sender[0]}</AvatarFallback>
                                    </Avatar>

                                    <div className={cn(
                                        "flex flex-col max-w-[80%]",
                                        msg.sender === "me" ? "items-end" : "items-start"
                                    )}>
                                        <div className={cn(
                                            "rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                                            msg.sender === "me"
                                                ? "bg-primary text-primary-foreground rounded-br-none"
                                                : msg.role === "assistant"
                                                    ? "bg-muted/50 border border-primary/20 text-foreground rounded-bl-none shadow-[0_0_10px_rgba(var(--primary),0.05)]"
                                                    : "bg-muted text-foreground rounded-bl-none"
                                        )}>
                                            {msg.content === "" && msg.role === "assistant" && msg.isStreaming ? (
                                                <div className="flex items-center gap-2 py-1">
                                                    <span className="text-sm font-medium bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Neural processing</span>
                                                    <span className="flex gap-1">
                                                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }} />
                                                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '1s' }} />
                                                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '1s' }} />
                                                    </span>
                                                </div>
                                            ) : (
                                                <>
                                                    {msg.content}
                                                    {msg.isStreaming && msg.content && <span className="inline-block w-1.5 h-4 ml-1 bg-primary/40 animate-pulse align-middle" />}
                                                </>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-muted-foreground mt-1 px-1">
                                            {msg.time} {msg.sent && "• Delivered"}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {/* Removed legacy typing spinner - now handled inside message bubble */}
                        </div>
                    </ScrollArea>

                    {/* Input Area */}
                    <div className="p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                        <MessageInput onSendMessage={handleSendMessage} className="max-w-4xl mx-auto" />
                    </div>
                </div>

                {/* Brain Sidebar Overlay/Panel */}
                {isBrainOpen && (
                    <div className={cn(
                        "fixed inset-y-0 right-0 z-50 w-full sm:w-80 h-full border-l bg-background/95 backdrop-blur-xl animate-in slide-in-from-right duration-300 md:relative md:z-auto",
                        "shadow-2xl md:shadow-none"
                    )}>
                        <div className="h-full flex flex-col">
                            <div className="flex items-center justify-between p-4 border-b">
                                <h3 className="text-sm font-bold flex items-center gap-2">
                                    <Brain className="h-4 w-4 text-primary" />
                                    Neural Knowledge
                                </h3>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsBrainOpen(false)}>
                                    <Plus className="h-4 w-4 rotate-45" />
                                </Button>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <BrainManager conversationId={currentConversationId} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

