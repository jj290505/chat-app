"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import ContactsSidebar from "@/components/chat/ContactsSidebar"
import ChatArea from "@/components/chat/ChatArea"
import ContactChat from "@/components/chat/ContactChat"
import { Contact } from "@/services/contact"
import { signInGuest } from "@/services/auth"
import { Loader2 } from "lucide-react"

export default function ChatPage() {
    const [activeChat, setActiveChat] = useState<{
        type: "ai" | "contact"
        contact?: Contact
    }>({
        type: "ai",
    })
    const [isAuthLoading, setIsAuthLoading] = useState(true)

    useEffect(() => {
        const checkUser = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                try {
                    await signInGuest()
                } catch (error) {
                    console.error("Auto guest login failed:", error)
                }
            }
            setIsAuthLoading(false)
        }
        checkUser()
    }, [])

    const handleSelectChat = (type: "ai" | "contact", contact?: Contact) => {
        setActiveChat({
            type,
            contact,
        })
    }

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
        <main className="flex h-screen w-full overflow-hidden bg-background">
            {/* Contacts Sidebar - For 1v1 messaging and AI Chat */}
            <div className="hidden md:flex h-full">
                <ContactsSidebar
                    onSelectChat={handleSelectChat}
                    activeChat={activeChat}
                />
            </div>

            {/* Main Chat Area */}
            <div className="flex flex-1 flex-col h-full overflow-hidden">
                {activeChat.type === "ai" ? (
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
