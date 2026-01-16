"use client"

import { useState } from "react"
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
import { searchProfiles, sendChatRequest, Profile } from "@/services/contact"

export default function UserSearch() {
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<Profile[]>([])
    const [loading, setLoading] = useState(false)
    const [requestingId, setRequestingId] = useState<string | null>(null)
    const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set())

    const handleSearch = async () => {
        if (!query.trim()) return
        setLoading(true)
        try {
            const data = await searchProfiles(query)
            setResults(data)
        } catch (error) {
            console.error("Search error:", error)
        } finally {
            setLoading(false)
        }
    }

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

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                    <Search className="h-4 w-4 mr-2" />
                    Find Users
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Search for Users</DialogTitle>
                    <DialogDescription>
                        Enter a username or full name to find and request a chat.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex gap-2 mt-4">
                    <Input
                        placeholder="Search by username..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    />
                    <Button onClick={handleSearch} disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                    </Button>
                </div>

                <div className="mt-6 space-y-4 max-h-[300px] overflow-y-auto pr-2">
                    {results.length === 0 && !loading && query && (
                        <p className="text-center text-muted-foreground text-sm">No users found.</p>
                    )}
                    {results.map((profile) => (
                        <div key={profile.id} className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={profile.avatar_url || ""} />
                                    <AvatarFallback>{profile.username[0].toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="text-left">
                                    <p className="text-sm font-semibold">@{profile.username}</p>
                                    <p className="text-xs text-muted-foreground">{profile.full_name}</p>
                                </div>
                            </div>
                            <Button
                                size="sm"
                                variant={requestedIds.has(profile.id) ? "ghost" : "default"}
                                disabled={requestedIds.has(profile.id) || requestingId === profile.id}
                                onClick={() => handleSendRequest(profile.id)}
                            >
                                {requestingId === profile.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : requestedIds.has(profile.id) ? (
                                    <Check className="h-4 w-4" />
                                ) : (
                                    <UserPlus className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    )
}
