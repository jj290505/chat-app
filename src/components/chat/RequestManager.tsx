"use client"

import { useState, useEffect } from "react"
import { Check, X, UserCheck, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getPendingRequests, respondToRequest, ChatRequest, subscribeToChatRequests } from "@/services/contact"
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

        // Subscribe to real-time request updates
        let subscription: any = null;

        const setupSubscription = async () => {
            try {
                subscription = await subscribeToChatRequests(
                    (newRequest) => {
                        // New request received
                        setRequests((prev) => [newRequest, ...prev]);
                    },
                    (updatedRequest) => {
                        // Request status changed (e.g., another client accepted/rejected)
                        if (updatedRequest.status !== "pending") {
                            setRequests((prev) => prev.filter(r => r.id !== updatedRequest.id));
                        } else {
                            setRequests((prev) =>
                                prev.map(r => r.id === updatedRequest.id ? updatedRequest : r)
                            );
                        }
                    }
                );
            } catch (error) {
                console.error("Error setting up subscription:", error);
            }
        };

        setupSubscription();

        return () => {
            subscription?.unsubscribe();
        };
    }, [])

    const handleResponse = async (requestId: string, status: 'accepted' | 'rejected') => {
        setProcessingId(requestId)
        try {
            await respondToRequest(requestId, status)
            setRequests((prev) => prev.filter(r => r.id !== requestId))
            // Trigger contact list reload
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
                    <div key={request.id} className="flex flex-col gap-2 p-3 bg-card border rounded-xl shadow-sm hover:border-primary/20 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                            <Avatar className="h-9 w-9 shrink-0 border border-primary/10">
                                <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                                    {request.sender_profile?.username?.[0].toUpperCase() || "?"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="text-left min-w-0 flex-1">
                                <p className="text-sm font-bold truncate">@{request.sender_profile?.username}</p>
                                <p className="text-[10px] text-muted-foreground font-medium">New Chat Request</p>
                            </div>
                        </div>
                        <div className="flex gap-2 w-full">
                            <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 h-8 text-[11px] font-bold text-destructive hover:bg-destructive/10 border-destructive/10"
                                onClick={() => handleResponse(request.id, 'rejected')}
                                disabled={processingId === request.id}
                            >
                                <X className="h-3.5 w-3.5 mr-1" />
                                Decline
                            </Button>
                            <Button
                                size="sm"
                                variant="default"
                                className="flex-1 h-8 text-[11px] font-bold shadow-sm"
                                onClick={() => handleResponse(request.id, 'accepted')}
                                disabled={processingId === request.id}
                            >
                                {processingId === request.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <>
                                        <Check className="h-3.5 w-3.5 mr-1" />
                                        Accept
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
    )
}
