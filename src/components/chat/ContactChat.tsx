"use client"

import { useState, useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Phone, Video, Info, Trash2, Loader2, Paperclip, MoreVertical, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
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
import { cn } from "@/lib/utils"
import { getCurrentUser } from "@/services/auth"
import { getDirectMessages, sendDirectMessage, subscribeToMessages, uploadFile, clearMessages } from "@/services/contact"
import { Contact, DirectMessage } from "@/services/contact"
import { RealtimeChannel } from "@supabase/supabase-js"
import MessageInput from "./MessageInput"

interface ContactChatProps {
  contact: Contact;
  onToggleSidebar?: () => void;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  media_url?: string | null;
  media_type?: string | null;
  created_at: string;
  senderName?: string;
  isOwn?: boolean;
}

export default function ContactChat({ contact, onToggleSidebar }: ContactChatProps) {
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
        const messages = await getDirectMessages(contact.id)
        const formattedMessages: Message[] = messages.map((msg) => ({
          ...msg,
          isOwn: msg.sender_id === userId,
          senderName: msg.sender_id === userId ? "You" : contact.contact_name,
        }))
        setMessages(formattedMessages)
      } catch (error) {
        console.error("Error loading messages:", error)
      } finally {
        setLoading(false)
      }
    }

    loadMessages()

    // Subscribe to real-time messages
    let subscription: RealtimeChannel | null = null;

    const setupSubscription = async () => {
      subscription = await subscribeToMessages(contact.id, (newMessage) => {
        setMessages((prev) => [
          ...prev,
          {
            ...newMessage,
            isOwn: newMessage.sender_id === userId,
            senderName:
              newMessage.sender_id === userId
                ? "You"
                : contact.contact_name || "Unknown",
          },
        ])
      });
    };

    setupSubscription();

    return () => {
      subscription?.unsubscribe();
    }
  }, [userId, contact.id, contact.contact_name])

  const handleClearChat = async () => {
    if (!contact.id) return
    try {
      await clearMessages(contact.contact_user_id)
      setMessages([])
    } catch (error) {
      console.error("Error clearing chat:", error)
    }
  }

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

  const handleSendMessage = async (content: string, isAiMode: boolean, mediaFile?: File | null) => {
    if ((!content.trim() && !mediaFile) || !contact.contact_user_id) return

    setSending(true)
    try {
      let mediaUrl = null;
      let mediaType = null;

      if (mediaFile) {
        mediaUrl = await uploadFile(mediaFile);
        mediaType = mediaFile.type;
      }

      await sendDirectMessage(contact.contact_user_id, content, mediaUrl, mediaType)
      setMessageInput("")
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
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
          <Avatar className="h-8 w-8 md:h-9 md:w-9">
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

        <div className="flex items-center gap-1 md:gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 rounded-full">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 rounded-full hidden sm:flex">
            <Video className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-4 mx-0.5 md:mx-1 hidden sm:flex" />

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
                    <span className="text-destructive">Clear Chat</span>
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Clear Chat History</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to clear all messages with {contact.contact_name}? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-end gap-3 mt-4">
                    <DialogTrigger asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogTrigger>
                    <DialogTrigger asChild>
                      <Button
                        variant="destructive"
                        onClick={handleClearChat}
                      >
                        Clear Everything
                      </Button>
                    </DialogTrigger>
                  </div>
                </DialogContent>
              </Dialog>
              <DropdownMenuItem>
                <Info className="mr-2 h-4 w-4" />
                <span>View Profile</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 w-full overflow-hidden" ref={scrollRef}>
        <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 p-4 md:p-6">
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
                    {msg.media_url && (
                      <div className="mt-2 rounded-lg overflow-hidden border border-white/10 bg-black/20">
                        {msg.media_type?.startsWith("image/") ? (
                          <img
                            src={msg.media_url}
                            alt="Shared media"
                            className="max-w-full h-auto object-cover max-h-60"
                          />
                        ) : (
                          <div className="p-3 flex items-center gap-2">
                            <Paperclip className="w-4 h-4" />
                            <a
                              href={msg.media_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs underline hover:text-primary transition-colors truncate max-w-[150px]"
                            >
                              Download File
                            </a>
                          </div>
                        )}
                      </div>
                    )}
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
      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  )
}
