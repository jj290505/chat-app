"use client"

import { useState, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { MessageCircle, Plus, LogOut, LogIn, Settings, User, Users, Bell, Brain, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { getContacts, Contact } from "@/services/contact"
import { getCurrentUser, signInWithGoogle, logout } from "@/services/auth"
import { listConversations, Conversation } from "@/services/conversation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import UserSearch from "./UserSearch"
import RequestManager from "./RequestManager"
import ProfileSettings from "./ProfileSettings"

interface ContactsSidebarProps {
  onSelectChat: (type: "ai" | "contact", contact?: Contact, conversationId?: string | null) => void;
  activeChat: { type: "ai" | "contact"; contact?: Contact; conversationId?: string | null } | null;
}

export default function ContactsSidebar({
  onSelectChat,
  activeChat,
}: ContactsSidebarProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [aiConversations, setAiConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [user, setUser] = useState<{ id: string; name: string; email: string; avatar_url?: string | null; username?: string } | null>(null)
  const [activeTab, setActiveTab] = useState("ai")
  const [pendingRequestCount, setPendingRequestCount] = useState(0)

  const loadContacts = async () => {
    try {
      setLoading(true)
      const data = await getContacts()
      setContacts(data)
    } catch (error) {
      console.error("Error loading contacts:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadAiConversations = async () => {
    try {
      setLoading(true)
      const data = await listConversations()
      setAiConversations(data)
    } catch (error) {
      console.error("Error loading AI conversations:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContacts()
    loadAiConversations()
    loadPendingCount()
  }, [])

  const loadPendingCount = async () => {
    try {
      const { getPendingRequests } = await import("@/services/contact")
      const requests = await getPendingRequests()
      setPendingRequestCount(requests.length)
    } catch (error) {
      console.error("Error loading pending count:", error)
    }
  }

  const loadUser = async () => {
    const userData = await getCurrentUser()
    if (userData) {
      setUser({
        ...userData,
        name: userData.name || "Guest User"
      })
    }
  }

  useEffect(() => {
    loadUser()
  }, [])

  const filteredContacts = contacts.filter((contact) =>
    contact.contact_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="w-[80vw] md:w-80 border-r flex flex-col h-full bg-background/50 backdrop-blur-xl">
      {/* Header */}
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-xl tracking-tight">Nexus Chat</h2>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <UserSearch />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="ai" className="flex-1 flex flex-col h-full overflow-hidden" onValueChange={setActiveTab}>
        <div className="px-4 py-2 border-b">
          <TabsList className="w-full grid grid-cols-3 h-9 bg-muted/50 p-1">
            <TabsTrigger value="ai" className="text-xs gap-2">
              <Sparkles className="h-3.5 w-3.5" />
              AI
            </TabsTrigger>
            <TabsTrigger value="chats" className="text-xs gap-2">
              <MessageCircle className="h-3.5 w-3.5" />
              Contacts
            </TabsTrigger>
            <TabsTrigger value="requests" className="text-xs gap-2 relative">
              <Bell className="h-3.5 w-3.5" />
              Reqs
              {pendingRequestCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {pendingRequestCount > 9 ? '9+' : pendingRequestCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="ai" className="flex-1 flex flex-col mt-0 h-full overflow-hidden">
          {/* New Chat Button */}
          <div className="px-3 py-4">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12 px-4 rounded-xl border-dashed border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all group"
              onClick={() => onSelectChat("ai", undefined, null)}
            >
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <Plus className="h-4 w-4" />
              </div>
              <span className="font-semibold text-sm">New AI Conversation</span>
            </Button>
          </div>

          <div className="px-3 pb-2">
            <div className="text-[10px] text-muted-foreground px-2 uppercase tracking-widest font-bold opacity-50 mb-2">
              Recent History
            </div>
            <Input
              placeholder="Search history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 bg-muted/30 border-none text-[11px] rounded-lg mb-2"
            />
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {loading && aiConversations.length === 0 ? (
                <div className="flex flex-col gap-2 p-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 w-full bg-muted/20 animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : aiConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center opacity-40">
                  <Sparkles className="h-8 w-8 mb-2" />
                  <p className="text-xs">No history yet</p>
                </div>
              ) : (
                aiConversations.map((conv) => (
                  <Button
                    key={conv.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3 h-12 py-2 px-3 rounded-lg border border-transparent transition-all overflow-hidden",
                      activeChat?.type === "ai" && activeChat?.conversationId === conv.id ?
                        "bg-primary/10 text-primary border-primary/10" : "hover:bg-muted/50"
                    )}
                    onClick={() => onSelectChat("ai", undefined, conv.id)}
                  >
                    <MessageCircle className="h-4 w-4 shrink-0 opacity-60" />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-xs font-medium truncate">
                        {conv.title}
                      </p>
                    </div>
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="chats" className="flex-1 flex flex-col mt-0 h-full overflow-hidden">
          <div className="p-3">
            <Input
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 bg-muted/50 border-none text-xs rounded-lg"
            />
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {loading ? (
                <div className="flex flex-col gap-2 p-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-14 w-full bg-muted/20 animate-pulse rounded-xl" />
                  ))}
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center opacity-40">
                  <Users className="h-10 w-10 mb-2" />
                  <p className="text-xs">No contacts yet</p>
                </div>
              ) : (
                filteredContacts.map((contact) => (
                  <Button
                    key={contact.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3 h-16 py-2 px-3 rounded-xl border border-transparent transition-all",
                      activeChat?.type === "contact" &&
                        activeChat?.contact?.id === contact.id ?
                        "bg-background shadow-sm border-primary/20" : "hover:bg-muted/50"
                    )}
                    onClick={() => onSelectChat("contact", contact)}
                  >
                    <Avatar className="h-11 w-11 shadow-sm">
                      <AvatarFallback className="bg-muted text-muted-foreground font-bold">
                        {contact.contact_name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <p className="font-bold text-sm truncate">
                          {contact.contact_name}
                        </p>
                        {contact.last_message_at && (
                          <span className="text-[9px] text-muted-foreground">
                            {new Date(contact.last_message_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate opacity-80">
                        {contact.last_message || "Start a conversation"}
                      </p>
                    </div>
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="requests" className="flex-1 mt-0 p-4 h-full overflow-hidden">
          <RequestManager onStatusChange={() => {
            loadContacts()
            loadPendingCount()
          }} />
        </TabsContent>
      </Tabs>

      {/* User Profile Section */}
      <div className="p-4 border-t mt-auto bg-muted/20">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-auto py-2 px-2 hover:bg-background/80 rounded-xl"
              >
                <Avatar className="h-9 w-9 border-2 border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {user.name[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-bold text-sm truncate">{user.name}</p>
                  <p className="text-[9px] text-muted-foreground truncate font-medium">
                    {user.username ? `@${user.username}` : "Set username"} • Online
                  </p>
                </div>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl">
              <ProfileSettings
                onUpdate={loadUser}
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Edit Profile</span>
                  </DropdownMenuItem>
                }
              />
              <DropdownMenuItem onClick={() => signInWithGoogle()}>
                <LogIn className="mr-2 h-4 w-4" />
                <span>Switch Account</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => logout()} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            variant="default"
            className="w-full justify-center gap-2 rounded-xl"
            onClick={() => signInWithGoogle()}
          >
            <LogIn className="h-4 w-4" />
            Sign in with Google
          </Button>
        )}
      </div>
    </div>
  )
}
