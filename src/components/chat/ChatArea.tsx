"use client"

import { useState, useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Phone, Video, Info, Loader2, Trash2, MoreVertical } from "lucide-react"
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

export default function ChatArea() {
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, sender: "Alice Thompson", role: "user", content: "Hey! Did you check the new AI integration?", time: "10:15 AM" },
        { id: 4, sender: "Nexus AI", role: "assistant", content: "Hello! I am Nexus AI. I can assist you with your conversation or provide information directly. Just mention me!", time: "10:18 AM" },
    ])
    const [isTyping, setIsTyping] = useState(false)
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
    const [userName, setUserName] = useState<string>("User")
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
                { id: 1, sender: "Alice Thompson", role: "user", content: "Hey! Did you check the new AI integration?", time: "10:15 AM" },
                { id: 4, sender: "Nexus AI", role: "assistant", content: "Hello! I am Nexus AI. I can assist you with your conversation or provide information directly. Just mention me!", time: "10:18 AM" },
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
            setIsTyping(true)
            try {
                // Create conversation on first AI message
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

                const response = await fetch("/api/ai/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        messages: messages.map(m => ({ role: m.role, content: m.content })),
                        currentMessage: content.replace(/@ai/gi, "").trim(),
                        userName: userName
                    })
                })

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

                    // Save AI response to conversation
                    if (currentConversationId) {
                        await addMessageToConversation(currentConversationId, {
                            role: "assistant",
                            content: accumulatedContent
                        })
                    }

                    setMessages(prev => prev.map(m =>
                        m.id === aiMsgId ? { ...m, isStreaming: false } : m
                    ))
                }
            } catch (error) {
                console.error("AI Error:", error)
                setIsTyping(false)
            }
        }
    }

    return (
        <div className="flex flex-col h-screen w-full overflow-hidden">
            {/* Chat Header */}
            <div className="h-16 border-b flex items-center justify-between px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                        <AvatarFallback>AT</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="text-sm font-semibold">Alice Thompson</p>
                        <p className="text-[10px] text-green-500 font-medium">Online</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                        <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                        <Video className="h-4 w-4" />
                    </Button>
                    <Separator orientation="vertical" className="h-4 mx-1" />
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
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

            {/* Messages Area */}
            <ScrollArea className="flex-1 w-full overflow-hidden" ref={scrollRef}>
                <div className="max-w-4xl mx-auto space-y-6 pb-4">
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
                                            : "bg-muted text-foreground rounded-bl-none",
                                    msg.isStreaming && "animate-pulse"
                                )}>
                                    {msg.content}
                                    {msg.isStreaming && <span className="inline-block w-1.5 h-4 ml-1 bg-primary/40 animate-pulse align-middle" />}
                                </div>
                                <span className="text-[10px] text-muted-foreground mt-1 px-1">
                                    {msg.time} {msg.sent && "• Delivered"}
                                </span>
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 shrink-0">
                                <AvatarFallback>AI</AvatarFallback>
                            </Avatar>
                            <div className="bg-muted/50 border border-primary/20 rounded-2xl px-4 py-2.5 rounded-bl-none">
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Input Area */}
            <MessageInput onSendMessage={handleSendMessage} className="flex-shrink-0" />
        </div>
    )
}

