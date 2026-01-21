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

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary/40" /></div>

    if (requests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-white/5 rounded-3xl border border-dashed border-white/10 mx-2">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 transition-transform hover:scale-110">
                    <UserCheck className="h-8 w-8 text-slate-700" />
                </div>
                <div>
                    <p className="text-white font-bold tracking-tight">System Synchronized</p>
                    <p className="text-[11px] text-slate-500 font-medium mt-1">No pending incoming signals detected</p>
                </div>
            </div>
        )
    }

    return (
        <ScrollArea className="h-full custom-scrollbar">
            <div className="space-y-4 p-2 pb-6">
                <div className="flex items-center justify-between px-2 mb-2">
                    <h3 className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Pending Requests</h3>
                    <span className="bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/20">{requests.length}</span>
                </div>
                {requests.map((request) => (
                    <div key={request.id} className="flex flex-col gap-4 p-5 bg-white/5 backdrop-blur-md border border-white/5 rounded-3xl shadow-xl transition-all hover:bg-white/10">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            <Avatar className="h-12 w-12 shrink-0 border-2 border-primary/20 bg-slate-900 shadow-lg">
                                <AvatarFallback className="text-primary font-bold text-lg">
                                    {request.sender_profile?.username?.[0].toUpperCase() || "?"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="text-left min-w-0 flex-1">
                                <p className="text-[15px] font-bold text-white truncate tracking-tight">@{request.sender_profile?.username}</p>
                                <div className="flex items-center gap-1.5 mt-0.5 text-slate-400">
                                    <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-pulse"></span>
                                    <p className="text-[11px] font-medium tracking-tight">Incoming signal detected</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2.5">
                            <Button
                                size="sm"
                                variant="ghost"
                                className="flex-1 h-11 bg-red-500/5 hover:bg-red-500/10 text-red-400 border border-red-500/10 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all"
                                onClick={() => handleResponse(request.id, 'rejected')}
                                disabled={processingId === request.id}
                            >
                                <X className="h-4 w-4 mr-2" />
                                Decline
                            </Button>
                            <Button
                                size="sm"
                                className="flex-1 h-11 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                onClick={() => handleResponse(request.id, 'accepted')}
                                disabled={processingId === request.id}
                            >
                                {processingId === request.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        <Check className="h-4 w-4 mr-2 stroke-[3]" />
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
