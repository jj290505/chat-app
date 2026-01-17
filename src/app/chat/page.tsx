"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { MessageCircle, Loader2, Menu } from "lucide-react"
import ContactsSidebar from "@/components/chat/ContactsSidebar"
import ChatArea from "@/components/chat/ChatArea"
import ContactChat from "@/components/chat/ContactChat"
import { Contact } from "@/services/contact"
import { signInGuest } from "@/services/auth"
import BrainManager from "@/components/chat/BrainManager"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function ChatPage() {
    const [activeChat, setActiveChat] = useState<{
        type: "ai" | "contact"
        contact?: Contact
        conversationId?: string | null
    }>({
        type: "ai",
        conversationId: null,
    })
    const [isAuthLoading, setIsAuthLoading] = useState(true)
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const checkUser = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push("/")
                return
            }
            setIsAuthLoading(false)
        }
        checkUser()
    }, [router])

    const handleSelectChat = (type: "ai" | "contact", contact?: Contact, conversationId?: string | null) => {
        setActiveChat({
            type,
            contact,
            conversationId,
        })
        // Close sidebar on mobile after selection
        setIsSidebarOpen(false)
    }

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

    if (isAuthLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground animate-pulse text-sm">Initializing Secure Session...</p>
                </div>
            </div>
        )
    }

    return (
        <main className="flex h-screen w-full overflow-hidden bg-background relative">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-all duration-300"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Contacts Sidebar */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-50 w-[80vw] md:w-80 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:flex h-full",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <ContactsSidebar
                    onSelectChat={handleSelectChat}
                    activeChat={activeChat}
                />
            </div>

            {/* Main Chat Area */}
            <div className="flex flex-1 flex-col h-full overflow-hidden w-full">
                {activeChat.type === "ai" ? (
                    <ChatArea
                        conversationId={activeChat.conversationId}
                        onToggleSidebar={toggleSidebar}
                    />
                ) : activeChat.contact ? (
                    <ContactChat
                        contact={activeChat.contact}
                        onToggleSidebar={toggleSidebar}
                    />
                ) : (
                    <div className="flex-1 flex flex-col h-full overflow-hidden">
                        {/* Mobile Header for Empty State */}
                        <div className="h-16 border-b flex items-center px-4 md:hidden bg-background/95 backdrop-blur sticky top-0 z-10">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-xl text-muted-foreground"
                                onClick={toggleSidebar}
                            >
                                <Menu className="h-5 w-5" />
                            </Button>
                            <span className="ml-3 font-semibold text-sm">Nexus AI</span>
                        </div>

                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                                <MessageCircle className="h-8 w-8 text-primary opacity-60" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground/80 mb-2">Welcome to Nexus</h3>
                            <p className="max-w-xs text-sm leading-relaxed">Select a contact or start a new AI conversation to begin your journey.</p>
                            <Button
                                variant="outline"
                                className="mt-8 md:hidden"
                                onClick={toggleSidebar}
                            >
                                Open Conversations
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    )
}
