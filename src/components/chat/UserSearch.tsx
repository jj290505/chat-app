"use client"

import { useState, useEffect } from "react"
import { Search, UserPlus, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { searchProfiles, sendChatRequest, getSuggestedProfiles, Profile } from "@/services/contact"
import { cn } from "@/lib/utils"

export default function UserSearch() {
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<Profile[]>([])
    const [suggestions, setSuggestions] = useState<Profile[]>([])
    const [loading, setLoading] = useState(false)
    const [loadingSuggestions, setLoadingSuggestions] = useState(false)
    const [requestingId, setRequestingId] = useState<string | null>(null)
    const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set())

    // Load initial suggestions
    useEffect(() => {
        const loadSuggestions = async () => {
            setLoadingSuggestions(true)
            try {
                const data = await getSuggestedProfiles()
                setSuggestions(data)
            } catch (error) {
                console.error("Error loading suggestions:", error)
            } finally {
                setLoadingSuggestions(false)
            }
        }
        loadSuggestions()
    }, [])

    // Automatic search with debounce
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.trim().length >= 2) {
                setLoading(true)
                try {
                    const data = await searchProfiles(query)
                    setResults(data)
                } catch (error) {
                    console.error("Search error:", error)
                } finally {
                    setLoading(false)
                }
            } else {
                setResults([])
            }
        }, 500)

        return () => clearTimeout(timer)
    }, [query])

    const handleSendRequest = async (profileId: string) => {
        setRequestingId(profileId)
        try {
            await sendChatRequest(profileId)
            setRequestedIds((prev) => new Set(prev).add(profileId))
        } catch (error: any) {
            console.error("Request error:", error)
            alert(error.message || "Failed to send request")
        } finally {
            setRequestingId(null)
        }
    }

    const renderUserItem = (profile: Profile) => {
        if (!profile || (!profile.id)) return null;

        const username = profile.username || "unknown";
        const fullName = profile.full_name || "Nexus User";

        return (
            <div key={profile.id} className="flex items-center justify-between gap-3 p-4 rounded-2xl hover:bg-primary/5 transition-all border border-transparent hover:border-primary/10 group">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Avatar className="h-14 w-14 border-2 border-primary/20 group-hover:border-primary/40 transition-all duration-300 group-hover:scale-105 group-hover:rotate-3 shadow-lg">
                            <AvatarImage src={profile.avatar_url || ""} />
                            <AvatarFallback className="bg-primary/10 text-primary text-lg font-black">
                                {username[0]?.toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-emerald-500 border-2 border-background rounded-full" />
                    </div>
                    <div className="text-left">
                        <p className="text-sm font-black tracking-tight text-foreground group-hover:text-primary transition-colors">
                            @{username}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-70">
                            {fullName}
                        </p>
                    </div>
                </div>
                <Button
                    size="sm"
                    variant={requestedIds.has(profile.id) ? "ghost" : "default"}
                    disabled={requestedIds.has(profile.id) || requestingId === profile.id}
                    onClick={() => handleSendRequest(profile.id)}
                    className={cn(
                        "h-10 px-5 rounded-xl font-black uppercase tracking-widest transition-all text-[10px]",
                        requestedIds.has(profile.id)
                            ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                            : "hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/20"
                    )}
                    style={!requestedIds.has(profile.id) ? { backgroundColor: '#059669', color: 'white' } : {}}
                >
                    {requestingId === profile.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : requestedIds.has(profile.id) ? (
                        <div className="flex items-center gap-1.5">
                            <Check className="h-3 w-3 stroke-[3]" />
                            <span>Sent</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5">
                            <UserPlus className="h-3 w-3 stroke-[3]" />
                            <span>Connect</span>
                        </div>
                    )}
                </Button>
            </div>
        );
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full bg-primary/5 border-primary/20 hover:bg-primary/10 hover:border-primary/30 text-primary font-semibold transition-all group">
                    <Search className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                    Find New Friends
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-primary/10 shadow-2xl">
                <div className="p-6 pb-0">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Connect with Users</DialogTitle>
                        <DialogDescription className="text-muted-foreground font-medium">
                            Search thousands of users by username or name to start a conversation.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="relative mt-6 mb-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by username or name..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="h-12 pl-10 bg-muted/30 border-primary/10 focus:border-primary/30 focus:ring-primary/10 transition-all rounded-xl text-base"
                        />
                        {loading && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-6 py-4 max-h-[450px] overflow-y-auto scrollbar-hide bg-muted/5">
                    {query.trim().length < 2 ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-[10px] font-black text-primary/60 uppercase tracking-[0.2em] ml-1">Suggested for you</h3>
                            </div>
                            {loadingSuggestions ? (
                                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                    <div className="relative">
                                        <Loader2 className="h-10 w-10 animate-spin text-primary/20" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="h-4 w-4 bg-primary rounded-full animate-pulse" />
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-primary/60 font-black uppercase tracking-widest animate-pulse">Scanning Nexus...</p>
                                </div>
                            ) : suggestions.length === 0 ? (
                                <div className="text-center py-12 px-6 bg-muted/20 rounded-3xl border-2 border-dashed border-primary/5">
                                    <div className="w-12 h-12 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <UserPlus className="h-5 w-5 text-primary/20" />
                                    </div>
                                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-tight">No transmissions found</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {suggestions.map(renderUserItem)}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-primary/60 uppercase tracking-[0.2em] ml-1">Search Results</h3>
                            {results.length === 0 && !loading ? (
                                <div className="text-center py-16 px-6 bg-muted/20 rounded-3xl border-2 border-dashed border-primary/5">
                                    <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-5">
                                        <Search className="h-8 w-8 text-primary/20" />
                                    </div>
                                    <p className="text-foreground text-sm font-black uppercase tracking-widest">No signals detected</p>
                                    <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-tight opacity-60">" {query} " yielded no results</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {results.map(renderUserItem)}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="p-4 bg-muted/10 border-t border-primary/5">
                    <p className="text-[10px] text-center text-muted-foreground font-medium">
                        Tips: Search for specific interests or names to find people you know.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    )
}
