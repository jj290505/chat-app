"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Profile {
    full_name: string | null
    email: string | null
    avatar_url: string | null
    username: string | null
}

export default function UserProfileCard() {
    const [profile, setProfile] = useState<Profile | null>(null)
    const supabase = createClient()

    const loadProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const { data } = await supabase
                .from("profiles")
                .select("full_name, email, avatar_url, username")
                .eq("id", user.id)
                .single()

            if (data) {
                setProfile(data)
            } else {
                // Fallback if profile trigger hasn't run or failed
                setProfile({
                    full_name: user.user_metadata.full_name || "User",
                    email: user.email || null,
                    avatar_url: user.user_metadata.avatar_url || null,
                    username: user.user_metadata.username || null
                })
            }
        }
    }

    useEffect(() => {
        loadProfile()
    }, [supabase])

    // Listen for profile updates from localStorage event (cross-tab communication)
    useEffect(() => {
        const handleStorageChange = () => {
            loadProfile()
        }

        window.addEventListener("storage", handleStorageChange)
        // Also listen for custom event when profile updates
        window.addEventListener("profileUpdated", handleStorageChange)

        return () => {
            window.removeEventListener("storage", handleStorageChange)
            window.removeEventListener("profileUpdated", handleStorageChange)
        }
    }, [])

    if (!profile) return null

    const displayName = profile.username ? `@${profile.username}` : (profile.full_name || profile.email)

    return (
        <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-300">
            <div className="relative">
                <Avatar className="h-10 w-10 border border-white/10 shadow-lg">
                    <AvatarImage src={profile.avatar_url || ""} />
                    <AvatarFallback className="bg-slate-900 text-primary text-xs font-bold">{displayName?.[0] || "U"}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-slate-950 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
            </div>
            <div className="flex-1 overflow-hidden">
                <p className="text-[13px] font-bold text-slate-100 truncate tracking-tight">{displayName}</p>
                <div className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></span>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-60">System Online</p>
                </div>
            </div>
        </div>
    )
}
