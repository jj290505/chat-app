"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { MessageCircle, Plus, Menu, X, User, Settings, LogOut, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { getContacts, Contact, subscribeToContacts, deleteContact, subscribeToChatRequests, ensureContactExists, markMessagesAsRead, getPendingRequests } from "@/services/contact"
import UserSearch from "./UserSearch"
import RequestManager from "./RequestManager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import UserProfileCard from "./UserProfileCard"
import LogoutButton from "../auth/LogoutButton"
import { Separator } from "@/components/ui/separator"

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
    <div className="w-auto min-w-[300px] max-w-[340px] md:w-80 flex flex-col h-full bg-slate-950 border-r border-white/5 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-white/5 space-y-4 bg-slate-900/40 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-xl tracking-tight text-white flex items-center gap-2">
            <span className="w-2 h-6 bg-primary rounded-full"></span>
            Interface
          </h2>
          <div className="flex gap-2">
            {/* Extra header actions can go here */}
          </div>
        </div>
        <UserSearch />
      </div>

      <Tabs defaultValue="chats" className="flex-1 flex flex-col min-h-0">
        <div className="px-6 py-3 border-b border-white/5">
          <TabsList className="grid w-full grid-cols-2 bg-white/5 p-1 rounded-xl h-10">
            <TabsTrigger value="chats" className="text-xs font-bold uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all duration-300">Chats</TabsTrigger>
            <TabsTrigger value="requests" className="text-xs font-bold uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all duration-300 relative">
              Requests
              {pendingRequestsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg shadow-red-900/40 border-2 border-slate-950 animate-in zoom-in duration-300">
                  {pendingRequestsCount > 99 ? "99+" : pendingRequestsCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="chats" className="flex-1 flex flex-col min-h-0 m-0">
          {/* AI Assistant - Enhanced Highlight */}
          <div className="px-4 py-4 mb-2">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-4 h-auto py-3 px-4 rounded-2xl border border-transparent transition-all duration-300 hover:bg-white/5",
                activeChat?.type === "ai"
                  ? "bg-primary/10 border-primary/20 shadow-lg shadow-primary/5"
                  : "bg-white/5"
              )}
              onClick={() => onSelectChat("ai")}
            >
              <div className="relative">
                <Avatar className="h-12 w-12 border-2 border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">VY</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-slate-950 rounded-full"></div>
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="font-bold text-[15px] text-white tracking-tight">VYRA</p>
                <p className="text-[11px] text-primary font-bold uppercase tracking-widest opacity-80">AI Assistant</p>
              </div>
              <div className="w-1.5 h-1.5 bg-primary/40 rounded-full"></div>
            </Button>
          </div>

          <Separator className="bg-white/5 mx-6" />

          {/* Search Contacts in sidebar */}
          <div className="px-6 py-4">
            <div className="relative group">
              <Input
                placeholder="Find contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 text-sm bg-white/5 border-white/10 rounded-xl pl-4 pr-10 focus:border-primary/50 transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Contacts List */}
          <ScrollArea className="flex-1 px-4 pb-4 custom-scrollbar">
            <div className="space-y-1.5">
              {loading ? (
                <div className="space-y-4 p-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-10 h-10 bg-white/5 rounded-full"></div>
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-2 bg-white/5 rounded w-1/2"></div>
                        <div className="h-2 bg-white/5 rounded w-3/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="text-center py-12 px-6">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
                    <User className="h-6 w-6 text-slate-700" />
                  </div>
                  <p className="text-xs text-slate-500 font-medium">No contacts found</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filteredContacts.map((contact) => (
                    <div key={contact.id} className="relative group px-1">
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start gap-4 h-auto py-3 px-3 rounded-2xl border border-transparent transition-all duration-300",
                          activeChat?.type === "contact" &&
                            activeChat?.contact?.id === contact.id
                            ? "bg-white/10 border-white/5 shadow-xl"
                            : "hover:bg-white/5"
                        )}
                        onClick={() => onSelectChat("contact", contact)}
                      >
                        <div className="relative">
                          <Avatar className="h-10 w-10 border border-white/10 shadow-lg">
                            <AvatarImage src={contact.contact_profile?.avatar_url || contact.contact_avatar_url || ""} />
                            <AvatarFallback className="bg-slate-900 border border-white/5 text-primary text-xs font-bold">
                              {(contact.contact_profile?.full_name || contact.contact_name)
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {/* Online indicator could go here if implemented */}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="font-bold text-[14px] text-slate-100 truncate tracking-tight">
                            {contact.contact_profile?.full_name || contact.contact_name}
                          </p>
                          <div className="flex items-center gap-1">
                            <p className={cn(
                              "text-[11px] truncate transition-colors",
                              contact.unread_count && contact.unread_count > 0
                                ? "text-primary font-bold"
                                : "text-slate-500 font-medium"
                            )}>
                              {contact.last_message || "Say hello..."}
                            </p>
                          </div>
                        </div>
                        {contact.unread_count && contact.unread_count > 0 ? (
                          <div className="flex items-center justify-center bg-primary text-[10px] font-bold text-primary-foreground min-w-[20px] h-[20px] px-1.5 rounded-full shrink-0 shadow-lg shadow-primary/20 animate-in zoom-in duration-300">
                            {contact.unread_count > 99 ? "99+" : contact.unread_count}
                          </div>
                        ) : null}
                      </Button>

                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (confirm(`Remove contact ${contact.contact_name}?`)) {
                              await deleteContact(contact.id);
                              loadContacts();
                              if (activeChat?.contact?.id === contact.id) {
                                onSelectChat("ai");
                              }
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="requests" className="flex-1 min-h-0 m-0 p-4 font-normal overflow-hidden bg-slate-950/50">
          <RequestManager onStatusChange={loadContacts} />
        </TabsContent>
      </Tabs>

      {/* User info at bottom */}
      <div className="p-6 border-t border-white/5 bg-slate-900/60 backdrop-blur-xl mt-auto">
        <div className="flex items-center justify-between gap-4">
          <UserProfileCard />
          <LogoutButton />
        </div>
      </div>
    </div>
  )
}
