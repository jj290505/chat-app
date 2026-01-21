"use client"

import { useState, useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Phone, Video, Info, Trash2, Loader2, MessageCircle, Send } from "lucide-react"
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
    <div className="flex flex-col h-full w-full overflow-hidden bg-slate-950">
      {/* Chat Header */}
      <div className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-10 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-11 w-11 border-2 border-primary/20 transition-transform hover:scale-105">
              <AvatarImage src={contact.contact_profile?.avatar_url || contact.contact_avatar_url || ""} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                {(contact.contact_profile?.full_name || contact.contact_name)
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-slate-900 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
          </div>
          <div>
            <p className="text-base font-bold tracking-tight text-white">{contact.contact_profile?.full_name || contact.contact_name}</p>
            <div className="flex items-center gap-1.5">
              <p className="text-[11px] text-green-400 font-bold uppercase tracking-widest">Secure Connection</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-full border border-white/10">
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
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 w-full overflow-hidden bg-[radial-gradient(circle_at_50%_10%,rgba(15,23,42,1)_0%,rgba(2,6,23,1)_100%)]" ref={scrollRef}>
        <div className="max-w-4xl mx-auto space-y-8 p-8">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <MessageCircle className="h-8 w-8 text-primary/40" />
              </div>
              <div>
                <p className="text-white font-medium">Clear encryption channel</p>
                <p className="text-xs text-slate-500">Messages are secured with end-to-end protocols</p>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex items-start gap-4 animate-in duration-500 slide-in-from-bottom-2 fade-in",
                  msg.isOwn ? "flex-row-reverse" : "flex-row"
                )}
              >
                {!msg.isOwn && (
                  <Avatar className="h-9 w-9 shrink-0 border border-white/10 shadow-lg mt-1">
                    <AvatarImage src={contact.contact_profile?.avatar_url || contact.contact_avatar_url || ""} />
                    <AvatarFallback className="bg-slate-900 text-primary text-[10px] font-bold">
                      {(contact.contact_profile?.full_name || contact.contact_name)[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={cn(
                    "flex flex-col",
                    msg.isOwn ? "items-end" : "items-start",
                    "max-w-[80%] md:max-w-[70%]"
                  )}
                >
                  <div
                    className={cn(
                      "px-5 py-3 text-[15px] leading-relaxed transition-all shadow-xl",
                      msg.isOwn
                        ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-none shadow-primary/10"
                        : "bg-slate-900 border border-white/10 text-slate-100 rounded-2xl rounded-tl-none shadow-black/50"
                    )}
                  >
                    {msg.content}
                  </div>
                  <div className="flex items-center gap-2 mt-2 px-1">
                    <span className="text-[10px] text-slate-500 font-medium">
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {msg.isOwn && <span className="text-[10px] text-primary/40 flex items-center gap-1">• Secure</span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="relative z-20">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none -translate-y-12 h-12"></div>
        <div className="border-t border-white/5 bg-slate-900/60 backdrop-blur-xl p-4 md:p-6 flex-shrink-0">
          <div className="max-w-4xl mx-auto flex items-end gap-3">
            <div className="flex-1 relative">
              <Input
                placeholder="Secure message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                disabled={sending}
                className="bg-white/5 border-white/10 focus:border-primary/50 text-white placeholder:text-slate-500 rounded-2xl h-12 pl-5 transition-all text-[15px]"
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!messageInput.trim() || sending}
              className={cn(
                "h-12 w-12 rounded-2xl transition-all shadow-lg",
                messageInput.trim() ? "bg-primary text-primary-foreground shadow-primary/20 scale-100" : "bg-white/5 text-slate-500 scale-95"
              )}
              size="icon"
            >
              {sending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
