"use client"

import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, Plus, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"

const MOCK_CONVERSATIONS = [
    { id: 1, name: "Alice Thompson", lastMessage: "Hey, are we still meeting?", time: "10:30 AM", unread: 2, online: true },
    { id: 2, name: "Bob Miller", lastMessage: "The AI reply was actually great.", time: "Yesterday", unread: 0, online: false },
    { id: 3, name: "Nexus AI", lastMessage: "I can help you with that task.", time: "Monday", unread: 0, online: true },
]

import UserProfileCard from "./UserProfileCard"
import LogoutButton from "../auth/LogoutButton"

export default function Sidebar() {
    return (
        <div className="flex flex-col h-full w-full">
            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold tracking-tight">Chats</h2>
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Plus className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Search */}
            <div className="p-4">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search messages..." className="pl-9 h-9" />
                </div>
            </div>

            {/* Conversations List */}
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {MOCK_CONVERSATIONS.map((chat) => (
                        <div
                            key={chat.id}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                        >
                            <div className="relative">
                                <Avatar className="h-10 w-10">
                                    <AvatarFallback>{chat.name[0]}</AvatarFallback>
                                </Avatar>
                                {chat.online && (
                                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500" />
                                )}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <div className="flex justify-between items-baseline mb-1">
                                    <span className="font-medium truncate">{chat.name}</span>
                                    <span className="text-[10px] text-muted-foreground">{chat.time}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-xs text-muted-foreground truncate">{chat.lastMessage}</p>
                                    {chat.unread > 0 && (
                                        <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                            {chat.unread}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            {/* User Footer */}
            <div className="p-4 border-t bg-muted/20 flex items-center justify-between">
                <UserProfileCard />
                <LogoutButton />
            </div>
        </div>
    )
}
