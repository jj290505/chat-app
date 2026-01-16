"use client"

import { useState, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { MessageCircle, Plus, LogOut, LogIn, Settings, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { getContacts, Contact } from "@/services/contact"
import { getCurrentUser, signInWithGoogle, logout } from "@/services/auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

  useEffect(() => {
    const loadContacts = async () => {
      try {
        const data = await getContacts()
        setContacts(data)
      } catch (error) {
        console.error("Error loading contacts:", error)
      } finally {
        setLoading(false)
      }
    }

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
    <div className="w-64 border-r flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg mb-3">Messages</h2>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => onSelectChat("ai")}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* AI Assistant */}
      <div className="px-2 py-2 border-b">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 h-auto py-2 px-3",
            activeChat?.type === "ai" && "bg-primary/10"
          )}
          onClick={() => onSelectChat("ai")}
        >
          <Avatar className="h-10 w-10">
            <AvatarFallback>AI</AvatarFallback>
          </Avatar>
          <div className="flex-1 text-left">
            <p className="font-semibold text-sm">Nexus AI</p>
            <p className="text-xs text-muted-foreground">Your AI Assistant</p>
          </div>
        </Button>
      </div>

      {/* Search */}
      <div className="p-3 border-b">
        <Input
          placeholder="Search contacts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-8 text-sm"
        />
      </div>

      {/* Contacts List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {loading ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              Loading...
            </p>
          ) : filteredContacts.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No contacts yet
            </p>
          ) : (
            <div className="space-y-1">
              {filteredContacts.map((contact) => (
                <Button
                  key={contact.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 h-auto py-2 px-2",
                    activeChat?.type === "contact" &&
                    activeChat?.contact?.id === contact.id &&
                    "bg-primary/10"
                  )}
                  onClick={() => onSelectChat("contact", contact)}
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>
                      {contact.contact_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-medium text-sm truncate">
                      {contact.contact_name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {contact.last_message || "No messages yet"}
                    </p>
                  </div>
                  {contact.last_message_at && (
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {new Date(contact.last_message_at).toLocaleDateString()}
                    </span>
                  )}
                </Button>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* User Profile Section */}
      <div className="p-4 border-t mt-auto">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-auto py-2 px-2 hover:bg-muted"
              >
                <Avatar className="h-9 w-9 border border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {user.name[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium text-sm truncate">{user.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {user.email || "Active Session"}
                  </p>
                </div>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
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
            className="w-full justify-center gap-2"
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
