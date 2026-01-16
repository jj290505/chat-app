"use client"

import { useState, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { MessageCircle, Plus, LogOut, LogIn, Settings, User, Users, Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import { getContacts, Contact } from "@/services/contact"
import { getCurrentUser, signInWithGoogle, logout } from "@/services/auth"
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

interface ContactsSidebarProps {
  onSelectChat: (type: "ai" | "contact", contact?: Contact) => void;
  activeChat: { type: "ai" | "contact"; contact?: Contact } | null;
}

export default function ContactsSidebar({
  onSelectChat,
  activeChat,
}: ContactsSidebarProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [user, setUser] = useState<{ id: string; name: string; email: string; avatar?: string } | null>(null)
  const [activeTab, setActiveTab] = useState("chats")

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

  useEffect(() => {
    loadContacts()
  }, [])

  useEffect(() => {
    const loadUser = async () => {
      const userData = await getCurrentUser()
      if (userData) {
        setUser({
          ...userData,
          name: userData.name || "Guest User"
        })
      }
    }
    loadUser()
  }, [])

  const filteredContacts = contacts.filter((contact) =>
    contact.contact_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="w-80 border-r flex flex-col h-full bg-background/50 backdrop-blur-xl">
      {/* Header */}
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-xl tracking-tight">Messaging</h2>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <UserSearch />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="chats" className="flex-1 flex flex-col h-full overflow-hidden" onValueChange={setActiveTab}>
        <div className="px-4 py-2 border-b">
          <TabsList className="w-full grid grid-cols-2 h-9 bg-muted/50 p-1">
            <TabsTrigger value="chats" className="text-xs gap-2">
              <MessageCircle className="h-3.5 w-3.5" />
              Chats
            </TabsTrigger>
            <TabsTrigger value="requests" className="text-xs gap-2">
              <Bell className="h-3.5 w-3.5" />
              Requests
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="chats" className="flex-1 flex flex-col mt-0 h-full overflow-hidden">
          {/* AI Assistant Sticky */}
          <div className="px-3 py-2 border-b bg-primary/5">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 h-14 px-3 rounded-xl border border-transparent transition-all",
                activeChat?.type === "ai" ? "bg-background shadow-sm border-primary/20" : "hover:bg-background/50"
              )}
              onClick={() => onSelectChat("ai")}
            >
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-white shadow-lg">
                <span className="font-bold text-xs">AI</span>
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-sm">Nexus AI</p>
                <p className="text-[10px] text-muted-foreground">Always active</p>
              </div>
            </Button>
          </div>

          <div className="p-3">
            <Input
              placeholder="Search conversations..."
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
          <RequestManager onStatusChange={loadContacts} />
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
                  <p className="text-[9px] text-muted-foreground truncate uppercase tracking-widest font-medium">
                    Online
                  </p>
                </div>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl">
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

