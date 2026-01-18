"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { MessageCircle, Plus, Menu, X, User, Settings, LogOut, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { getContacts, Contact, subscribeToContacts, deleteContact, subscribeToChatRequests, ensureContactExists, markMessagesAsRead, getPendingRequests } from "@/services/contact"
import UserSearch from "./UserSearch"
import RequestManager from "./RequestManager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import UserProfileCard from "./UserProfileCard"
import LogoutButton from "../auth/LogoutButton"

interface ContactsSidebarProps {
  onSelectChat: (type: "ai" | "contact", contact?: Contact) => void;
  activeChat: { type: "ai" | "contact"; contact?: Contact } | null;
  onClose?: () => void;
}

export default function ContactsSidebar({
  onSelectChat,
  activeChat,
}: ContactsSidebarProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)

  // Use a ref to avoid stale closures in real-time listeners
  const activeChatRef = useRef(activeChat)
  useEffect(() => {
    activeChatRef.current = activeChat
  }, [activeChat])

  const loadContacts = async () => {
    try {
      // 1. If we have an active contact chat, mark messages as read FIRST
      if (activeChat?.type === 'contact' && activeChat.contact) {
        await markMessagesAsRead(activeChat.contact.contact_user_id)
      }

      // 2. Fetch contacts (which will now have 0 unread for the active chat)
      const data = await getContacts()

      // 3. (Extra Safety) Manually ensure active contact has 0 unread in local state
      const processedData = data.map(contact => {
        if (activeChat?.type === 'contact' && activeChat.contact?.contact_user_id === contact.contact_user_id) {
          return { ...contact, unread_count: 0 };
        }
        return contact;
      });

      setContacts(processedData)

      // 4. Also refresh pending requests count
      const requests = await getPendingRequests()
      setPendingRequestsCount(requests.length)
    } catch (error) {
      console.error("Error loading contacts:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContacts()

    // Subscribe to real-time contact changes
    let subscription: any = null;

    const setupSubscription = async () => {
      try {
        subscription = await subscribeToContacts((data) => {
          // Reload contacts when any change is detected
          loadContacts();
        });
      } catch (error) {
        console.error("Error setting up contact subscription:", error);
      }
    };

    setupSubscription();

    // Global Message Listener to keep 'Last Message' and contact list fresh
    let messageSubscription: any = null;
    const setupMessageSubscription = async () => {
      try {
        const { data: { user } } = await createClient().auth.getUser();
        if (!user) return;

        const handleRealtimeUpdate = (msg: any) => {
          const currentActive = activeChatRef.current;
          const isIncoming = msg.receiver_id === user.id;
          const contactId = isIncoming ? msg.sender_id : msg.receiver_id;

          // Determine if this should increment the unread badge
          const isUnread = isIncoming && (
            !currentActive ||
            currentActive.type !== 'contact' ||
            currentActive.contact?.contact_user_id !== msg.sender_id
          );

          setContacts(prev => {
            const contactExists = prev.some(c => c.contact_user_id === contactId);
            if (!contactExists) {
              loadContacts(); // Fetch from scratch for new chats
              return prev;
            }

            return prev.map(c => {
              if (c.contact_user_id === contactId) {
                return {
                  ...c,
                  unread_count: isUnread ? (c.unread_count || 0) + 1 : 0,
                  last_message: msg.content,
                  last_message_at: msg.created_at
                };
              }
              return c;
            }).sort((a, b) => {
              // Priority sorting: contact with the newest message comes first
              if (a.contact_user_id === contactId) return -1;
              if (b.contact_user_id === contactId) return 1;
              const dateA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
              const dateB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
              return dateB - dateA;
            });
          });

          // Persistent Sync: If currently chatting, mark as read in database
          if (isIncoming && currentActive?.type === 'contact' && currentActive.contact?.contact_user_id === msg.sender_id) {
            markMessagesAsRead(msg.sender_id);
          }
        };

        messageSubscription = createClient()
          .channel(`notifications:${user.id}`)
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "direct_messages" },
            (payload) => handleRealtimeUpdate(payload.new)
          )
          .on(
            "broadcast",
            { event: "sidebar_update" },
            (payload) => handleRealtimeUpdate(payload.payload)
          )
          .subscribe();
      } catch (error) {
        console.error("Error setting up unified message listener:", error);
      }
    };
    setupMessageSubscription();

    // Also subscribe to chat requests to catch when a sent request is accepted
    let requestSubscription: any = null;
    const setupRequestSubscription = async () => {
      try {
        requestSubscription = await subscribeToChatRequests(
          (newReq) => {
            // Check if it's for me
            createClient().auth.getUser().then(({ data: { user } }) => {
              if (user && newReq.receiver_id === user.id) {
                setPendingRequestsCount(prev => prev + 1);
              }
            });
          },
          async (updatedRequest) => {
            // Fetch latest count to be safe when status changes
            const requests = await getPendingRequests();
            setPendingRequestsCount(requests.length);

            if (updatedRequest.status === 'accepted') {
              const { data: { user } } = await createClient().auth.getUser();
              if (user) {
                // If I was the sender, I need to ensure I have a contact for the receiver
                if (updatedRequest.sender_id === user.id) {
                  await ensureContactExists(updatedRequest.receiver_id);
                }
                // If I was the receiver, I need to ensure I have a contact for the sender
                else if (updatedRequest.receiver_id === user.id) {
                  await ensureContactExists(updatedRequest.sender_id);
                }
                loadContacts();
              }
            }
          }
        );
      } catch (error) {
        console.error("Error setting up request subscription in sidebar:", error);
      }
    };
    setupRequestSubscription();

    return () => {
      subscription?.unsubscribe();
      requestSubscription?.unsubscribe();
      messageSubscription?.unsubscribe();
    };
  }, [])

  // Reload contacts and clear badges when switching active chat
  useEffect(() => {
    if (activeChat?.type === 'contact') {
      loadContacts();
    }
  }, [activeChat?.contact?.id])

  const filteredContacts = contacts.filter((contact) =>
    contact.contact_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="w-auto min-w-[280px] max-w-[320px] md:w-72 border-r flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Messages</h2>
        </div>
        <UserSearch />
      </div>

      <Tabs defaultValue="chats" className="flex-1 flex flex-col min-h-0">
        <div className="px-4 py-2 border-b">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chats" className="text-xs">Chats</TabsTrigger>
            <TabsTrigger value="requests" className="text-xs relative">
              Requests
              {pendingRequestsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground animate-in zoom-in duration-300">
                  {pendingRequestsCount > 99 ? "99+" : pendingRequestsCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="chats" className="flex-1 flex flex-col min-h-0 m-0">
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

          {/* Search Contacts */}
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
                    <div key={contact.id} className="relative group">
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start gap-3 h-auto py-2 px-2 pr-10",
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
                        {contact.unread_count && contact.unread_count > 0 ? (
                          <div className="flex items-center justify-center bg-primary text-[10px] font-bold text-primary-foreground min-w-[18px] h-[18px] px-1 rounded-full shrink-0 animate-in zoom-in duration-300">
                            {contact.unread_count > 99 ? "99+" : contact.unread_count}
                          </div>
                        ) : null}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 h-8 w-8 text-muted-foreground hover:text-destructive transition-all"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (confirm(`Remove ${contact.contact_name} from contacts?`)) {
                            await deleteContact(contact.id);
                            loadContacts();
                            if (activeChat?.contact?.id === contact.id) {
                              onSelectChat("ai"); // Switch to AI chat if current contact is deleted
                            }
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="requests" className="flex-1 min-h-0 m-0 p-2 font-normal overflow-hidden">
          <RequestManager onStatusChange={loadContacts} />
        </TabsContent>
      </Tabs>

      {/* User info at bottom */}
      <div className="p-4 border-t bg-muted/20 mt-auto">
        <div className="flex items-center justify-between gap-2">
          <UserProfileCard />
          <LogoutButton />
        </div>
      </div>
    </div>
  )
}
