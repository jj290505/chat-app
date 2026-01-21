"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Settings } from "lucide-react"
import ProfileSettingsModal from "./ProfileSettingsModal"

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

    // Listen for profile settings open event and storage changes
    useEffect(() => {
        const handleStorageChange = () => {
            loadProfile()
        }

        const handleOpenSettings = () => {
            setIsSettingsOpen(true)
        }

        window.addEventListener("storage", handleStorageChange)
        window.addEventListener("profileUpdated", handleStorageChange)
        window.addEventListener("openProfileSettings", handleOpenSettings)

        return () => {
            window.removeEventListener("storage", handleStorageChange)
            window.removeEventListener("profileUpdated", handleStorageChange)
            window.removeEventListener("openProfileSettings", handleOpenSettings)
        }
    }, [])

    const [isSettingsOpen, setIsSettingsOpen] = useState(false)

    if (!profile) return null

    const displayName = profile.username ? `@${profile.username}` : (profile.full_name || profile.email)

    return (
        <>
            <button
                type="button"
                className="w-full text-left flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-300 cursor-pointer hover:bg-white/10 group focus:outline-none focus:ring-2 focus:ring-primary/50"
                onClick={() => setIsSettingsOpen(true)}
            >
                <div className="relative">
                    <Avatar className="h-10 w-10 border border-white/10 shadow-lg transition-transform group-hover:scale-105">
                        <AvatarImage src={profile.avatar_url || ""} />
                        <AvatarFallback className="bg-slate-900 text-primary text-xs font-bold">{displayName?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-slate-950 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className="text-[13px] font-bold text-slate-100 truncate tracking-tight group-hover:text-primary transition-colors">{displayName}</p>
                    <div className="flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></span>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-60">System Online</p>
                    </div>
                </div>
                <Settings className="w-4 h-4 text-slate-500 mr-2 group-hover:text-primary group-hover:rotate-90 transition-all duration-500" />
            </button>

            <ProfileSettingsModal
                open={isSettingsOpen}
                onOpenChange={setIsSettingsOpen}
                onProfileUpdated={loadProfile}
            />
        </>
    )
}
