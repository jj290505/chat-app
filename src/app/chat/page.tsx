"use client"

import { useState } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import ContactsSidebar from "@/components/chat/ContactsSidebar"
import ChatArea from "@/components/chat/ChatArea"
import ContactChat from "@/components/chat/ContactChat"
import { Contact } from "@/services/contact"
import { Menu, X, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function ChatPage() {
    const [activeChat, setActiveChat] = useState<{
        type: "ai" | "contact"
        contact?: Contact
    } | null>(null)
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const handleSelectChat = (type: "ai" | "contact", contact?: Contact) => {
        setActiveChat({
            type,
            contact,
        })
        setSidebarOpen(false) // Close sidebar on mobile after selection
    }

    return (
        <main className="flex h-screen w-full overflow-hidden bg-background">
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-14 border-b bg-background z-20 flex items-center px-4 justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
                        <Menu className="h-5 w-5" />
                    </Button>
                    <span className="font-bold text-lg bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">NEXORA</span>
                </div>
            </div>

            {/* Sidebar Overlay for Mobile */}
            {sidebarOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/50 z-30 transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Contacts Sidebar */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-40 w-72 bg-background border-r transition-transform md:relative md:translate-x-0 md:flex h-full shrink-0",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex flex-col h-full w-full">
                    <div className="md:hidden flex items-center justify-between p-4 border-b">
                        <span className="font-bold text-lg">NEXORA</span>
                        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                    <ContactsSidebar
                        onSelectChat={handleSelectChat}
                        activeChat={activeChat}
                    />
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex flex-1 flex-col h-full overflow-hidden pt-14 md:pt-0">
                {!activeChat ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
                        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-4">
                            <MessageCircle className="h-10 w-10 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold">Welcome to NEXORA</h2>
                        <p className="text-muted-foreground max-w-sm">
                            Select a contact from the sidebar to start messaging, or chat with our advanced AI assistant.
                        </p>
                        <Button variant="outline" className="md:hidden" onClick={() => setSidebarOpen(true)}>
                            Open Sidebar
                        </Button>
                    </div>
                ) : activeChat.type === "ai" ? (
                    <ChatArea />
                ) : activeChat.contact ? (
                    <ContactChat contact={activeChat.contact} />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">Select a contact to start chatting</p>
                    </div>
                )}
            </div>
        </main>
    )
}
