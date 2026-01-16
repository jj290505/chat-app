"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Profile {
    full_name: string | null
    email: string | null
    avatar_url: string | null
}

export default function UserProfileCard() {
    const [profile, setProfile] = useState<Profile | null>(null)
    const supabase = createClient()

    useEffect(() => {
        const getProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase
                    .from("profiles")
                    .select("full_name, email, avatar_url")
                    .eq("id", user.id)
                    .single()

                if (data) {
                    setProfile(data)
                } else {
                    // Fallback if profile trigger hasn't run or failed
                    setProfile({
                        full_name: user.user_metadata.full_name || "User",
                        email: user.email || null,
                        avatar_url: user.user_metadata.avatar_url || null
                    })
                }
            }
        }
        getProfile()
    }, [supabase])

    if (!profile) return null

    return (
        <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
                <AvatarImage src={profile.avatar_url || ""} />
                <AvatarFallback>{profile.full_name?.[0] || profile.email?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">{profile.full_name || profile.email}</p>
                <p className="text-xs text-muted-foreground truncate">Active now</p>
            </div>
        </div>
    )
}
