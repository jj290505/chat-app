"use client"

import { useState, useEffect } from "react"
import { Check, X, UserCheck, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getPendingRequests, respondToRequest, ChatRequest } from "@/services/contact"
import { ScrollArea } from "@/components/ui/scroll-area"

interface RequestManagerProps {
    onStatusChange?: () => void;
}

export default function RequestManager({ onStatusChange }: RequestManagerProps) {
    const [requests, setRequests] = useState<ChatRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState<string | null>(null)

    const loadRequests = async () => {
        try {
            const data = await getPendingRequests()
            setRequests(data)
        } catch (error) {
            console.error("Error loading requests:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadRequests()
    }, [])

    const handleResponse = async (requestId: string, status: 'accepted' | 'rejected') => {
        setProcessingId(requestId)
        try {
            await respondToRequest(requestId, status)
            setRequests((prev) => prev.filter(r => r.id !== requestId))
            onStatusChange?.()
        } catch (error) {
            console.error("Error responding to request:", error)
        } finally {
            setProcessingId(null)
        }
    }

    if (loading) return <div className="flex justify-center p-4"><Loader2 className="h-4 w-4 animate-spin" /></div>

    if (requests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/20 rounded-lg border border-dashed">
                <UserCheck className="h-8 w-8 text-muted-foreground mb-2 opacity-20" />
                <p className="text-sm text-muted-foreground">No pending requests</p>
            </div>
        )
    }

    return (
        <ScrollArea className="h-full">
            <div className="space-y-3 p-1">
                {requests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between gap-3 p-3 bg-card border rounded-xl shadow-sm">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                    {request.sender_profile?.username[0].toUpperCase() || "?"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="text-left">
                                <p className="text-sm font-semibold">@{request.sender_profile?.username}</p>
                                <p className="text-[10px] text-muted-foreground">wants to chat</p>
                            </div>
                        </div>
                        <div className="flex gap-1">
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                onClick={() => handleResponse(request.id, 'rejected')}
                                disabled={processingId === request.id}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                            <Button
                                size="icon"
                                variant="default"
                                className="h-8 w-8"
                                onClick={() => handleResponse(request.id, 'accepted')}
                                disabled={processingId === request.id}
                            >
                                {processingId === request.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                    <Check className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
    )
}
