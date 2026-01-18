"use client"

import { useState, useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Phone, Video, Info, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { getCurrentUser } from "@/services/auth"
import { getDirectMessages, sendDirectMessage, subscribeToMessages, markMessagesAsRead } from "@/services/contact"
import { Contact, DirectMessage } from "@/services/contact"

interface ContactChatProps {
  contact: Contact;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  senderName?: string;
  isOwn?: boolean;
}

export default function ContactChat({ contact }: ContactChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [userId, setUserId] = useState<string>("")
  const scrollRef = useRef<HTMLDivElement>(null)

  // Load current user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await getCurrentUser()
        if (user?.id) {
          setUserId(user.id)
        }
      } catch (error) {
        console.error("Error loading user:", error)
      }
    }
    loadUser()
  }, [])

  // Load messages and subscribe to real-time updates
  useEffect(() => {
    if (!userId || !contact.id) return

    const loadMessages = async () => {
      try {
        setLoading(true)
        const messages = await getDirectMessages(contact.contact_user_id)
        const formattedMessages: Message[] = messages.map((msg) => ({
          ...msg,
          isOwn: msg.sender_id === userId,
          senderName: msg.sender_id === userId ? "You" : contact.contact_name,
        }))
        setMessages(formattedMessages)
        // Mark as read when loading messages
        await markMessagesAsRead(contact.contact_user_id)
      } catch (error) {
        console.error("Error loading messages:", error)
      } finally {
        setLoading(false)
      }
    }

    loadMessages()

    // Subscribe to real-time messages
    let subscription: any = null;

    const setupSubscription = async () => {
      try {
        subscription = await subscribeToMessages(contact.contact_user_id, (newMessage) => {
          setMessages((prev) => {
            // Check if message already exists to avoid duplicates
            if (prev.some(msg => msg.id === newMessage.id)) {
              return prev;
            }
            return [
              ...prev,
              {
                ...newMessage,
                isOwn: newMessage.sender_id === userId,
                senderName:
                  newMessage.sender_id === userId
                    ? "You"
                    : contact.contact_name || "Unknown",
              },
            ];
          });
          // Mark as read when new message arrives in open chat
          if (newMessage.receiver_id === userId) {
            markMessagesAsRead(contact.contact_user_id);
          }
        });
      } catch (error) {
        console.error("Error setting up message subscription:", error);
      }
    };

    setupSubscription();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    }
  }, [userId, contact.id, contact.contact_name])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      const timer = setTimeout(() => {
        const viewport = scrollRef.current?.querySelector(
          "[data-radix-scroll-area-viewport]"
        )
        if (viewport) {
          viewport.scrollTop = viewport.scrollHeight
        }
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [messages])

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !contact.contact_user_id || !userId) return

    const content = messageInput.trim()
    setMessageInput("") // Clear input immediately for better UX

    // Optimistic Update: Add message to UI immediately
    const tempId = crypto.randomUUID()
    const optimisticMessage: Message = {
      id: tempId,
      sender_id: userId,
      receiver_id: contact.contact_user_id,
      content: content,
      created_at: new Date().toISOString(),
      isOwn: true,
      senderName: "You"
    }

    setMessages(prev => [...prev, optimisticMessage])
    setSending(true)

    try {
      const realMessage = await sendDirectMessage(contact.contact_user_id, content)
      // Replace optimistic message with real message to ensure consistency (ID and timestamp)
      setMessages(prev => prev.map(msg => msg.id === tempId ? {
        ...realMessage,
        isOwn: true,
        senderName: "You"
      } : msg))
    } catch (error) {
      console.error("Error sending message:", error)
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Chat Header */}
      <div className="h-16 border-b flex items-center justify-between px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback>
              {contact.contact_name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold">{contact.contact_name}</p>
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
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 w-full overflow-hidden" ref={scrollRef}>
        <div className="max-w-4xl mx-auto space-y-6 p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <p className="text-muted-foreground">
                  No messages yet. Start a conversation!
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex items-end gap-3",
                  msg.isOwn ? "flex-row-reverse" : "flex-row"
                )}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback>
                    {msg.isOwn ? "ME" : contact.contact_name[0]}
                  </AvatarFallback>
                </Avatar>

                <div
                  className={cn(
                    "flex flex-col max-w-[80%]",
                    msg.isOwn ? "items-end" : "items-start"
                  )}
                >
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                      msg.isOwn
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-muted text-foreground rounded-bl-none"
                    )}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 px-1">
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t bg-background p-4 flex-shrink-0">
        <div className="max-w-4xl mx-auto flex gap-3">
          <Input
            placeholder="Type a message..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            disabled={sending}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || sending}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Send"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
