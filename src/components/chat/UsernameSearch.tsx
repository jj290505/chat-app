"use client"

import { useState, useEffect } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface User {
    id: string
    username: string
    full_name: string
    avatar_url?: string
}

interface UsernameSearchProps {
    onSelectUser: (user: User) => void
    className?: string
}

export default function UsernameSearch({ onSelectUser, className }: UsernameSearchProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [results, setResults] = useState<User[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [showResults, setShowResults] = useState(false)

    useEffect(() => {
        const searchUsers = async () => {
            if (searchQuery.length < 2) {
                setResults([])
                setShowResults(false)
                return
            }

            setIsSearching(true)
            setShowResults(true)

            try {
                const supabase = createClient()
                const { data, error } = await supabase
                    .from("profiles")
                    .select("id, username, full_name, avatar_url")
                    .ilike("username", `${searchQuery}%`)
                    .limit(5)

                if (!error && data) {
                    setResults(data as User[])
                }
            } catch (error) {
                console.error("Error searching users:", error)
            } finally {
                setIsSearching(false)
            }
        }

        const debounce = setTimeout(searchUsers, 300)
        return () => clearTimeout(debounce)
    }, [searchQuery])

    const handleSelectUser = (user: User) => {
        onSelectUser(user)
        setSearchQuery("")
        setResults([])
        setShowResults(false)
    }

    return (
        <div className={cn("relative", className)}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Search username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-9"
                />
                {searchQuery && (
                    <button
                        onClick={() => {
                            setSearchQuery("")
                            setResults([])
                            setShowResults(false)
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {showResults && (
                <div className="absolute top-full mt-2 w-full bg-background border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                    {isSearching ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            Searching...
                        </div>
                    ) : results.length > 0 ? (
                        <div className="py-2">
                            {results.map((user) => (
                                <button
                                    key={user.id}
                                    onClick={() => handleSelectUser(user)}
                                    className="w-full px-4 py-2 flex items-center gap-3 hover:bg-muted transition-colors"
                                >
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback>
                                            {user.username?.[0]?.toUpperCase() || "U"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 text-left">
                                        <div className="font-medium text-sm">{user.username}</div>
                                        {user.full_name && (
                                            <div className="text-xs text-muted-foreground">{user.full_name}</div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            No users found
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
