"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Camera, User, AtSign, Sparkles } from "lucide-react"
import { updateProfile } from "@/services/auth"

interface Profile {
    full_name: string | null
    email: string | null
    avatar_url: string | null
    username: string | null
}

const USERNAME_PREFIXES = ["nexus", "nova", "pixel", "cyber", "zenith", "alpha", "ghost", "star", "neon", "crypto"]

export default function UserProfileCard() {
    const [profile, setProfile] = useState<Profile | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        full_name: "",
        username: ""
    })
    const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const supabase = createClient()

    const generateSuggestions = () => {
        const suggestions: string[] = []
        while (suggestions.length < 4) {
            const prefix = USERNAME_PREFIXES[Math.floor(Math.random() * USERNAME_PREFIXES.length)]
            const suffix = Math.floor(Math.random() * 9999)
            const suggestion = `${prefix}_${suffix}`
            if (!suggestions.includes(suggestion)) {
                suggestions.push(suggestion)
            }
        }
        setUsernameSuggestions(suggestions)
        setShowSuggestions(true)
    }

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
                setFormData({
                    full_name: data.full_name || "",
                    username: data.username || ""
                })
            } else {
                setProfile({
                    full_name: user.user_metadata.full_name || "User",
                    email: user.email || null,
                    avatar_url: user.user_metadata.avatar_url || null,
                    username: user.user_metadata.username || null
                })
                setFormData({
                    full_name: user.user_metadata.full_name || "",
                    username: user.user_metadata.username || ""
                })
            }
        }
    }

    useEffect(() => {
        loadProfile()
    }, [])

    const handleUpdate = async () => {
        setLoading(true)
        try {
            await updateProfile({
                full_name: formData.full_name,
                username: formData.username
            })
            await loadProfile()
            setIsEditing(false)
            // Notify other components
            window.dispatchEvent(new CustomEvent("profileUpdated"))
        } catch (error: any) {
            alert(error.message || "Failed to update profile")
        } finally {
            setLoading(false)
        }
    }

    if (!profile) return null

    const displayName = profile.username ? `@${profile.username}` : (profile.full_name || profile.email)

    return (
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
                <div className="flex items-center gap-3 cursor-pointer hover:bg-black/5 p-1 rounded-lg transition-colors group w-full overflow-hidden">
                    <div className="relative shrink-0">
                        <Avatar className="h-10 w-10 border border-primary/10 group-hover:border-primary/30 transition-colors">
                            <AvatarImage src={profile.avatar_url || ""} />
                            <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                                {profile.username?.[0]?.toUpperCase() || profile.full_name?.[0]?.toUpperCase() || "U"}
                            </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 bg-green-500 border-2 border-white rounded-full" />
                    </div>
                    <div className="flex-1 overflow-hidden text-left">
                        <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">{displayName}</p>
                        <p className="text-[10px] text-muted-foreground font-medium truncate">Online • View Profile</p>
                    </div>
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-primary/10 shadow-2xl">
                <div className="bg-gradient-to-br from-primary/10 via-background to-background p-6">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Edit Profile</DialogTitle>
                        <DialogDescription className="font-medium">
                            Set your identity on Nexus AI.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col items-center gap-6 py-8">
                        <div className="relative group">
                            <Avatar className="h-24 w-24 border-4 border-white shadow-xl ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
                                <AvatarImage src={profile.avatar_url || ""} />
                                <AvatarFallback className="text-3xl font-bold bg-primary/5 text-primary">
                                    {profile.username?.[0]?.toUpperCase() || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <Button size="icon" variant="secondary" className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-lg border-2 border-white cursor-pointer hover:scale-110 transition-transform">
                                <Camera className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="grid w-full gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="full_name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Full Name</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="full_name"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                                        className="pl-10 h-11 bg-white/50 border-primary/10 focus:border-primary/40 rounded-xl"
                                        placeholder="Your full name"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Username</Label>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={generateSuggestions}
                                        className="h-6 px-2 text-[10px] text-primary font-bold hover:bg-primary/10"
                                    >
                                        <Sparkles className="h-3 w-3 mr-1" />
                                        Suggestion
                                    </Button>
                                </div>
                                <div className="relative">
                                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="username"
                                        value={formData.username}
                                        onChange={(e) => {
                                            setFormData(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/\s/g, '') }))
                                            setShowSuggestions(false)
                                        }}
                                        className="pl-10 h-11 bg-white/50 border-primary/10 focus:border-primary/40 rounded-xl"
                                        placeholder="Unique username"
                                    />
                                </div>
                                {showSuggestions && (
                                    <div className="flex flex-wrap gap-2 mt-2 p-3 bg-primary/5 rounded-xl border border-primary/10 animate-in fade-in slide-in-from-top-1">
                                        {usernameSuggestions.map((suggestion) => (
                                            <button
                                                key={suggestion}
                                                onClick={() => {
                                                    setFormData(prev => ({ ...prev, username: suggestion }))
                                                    setShowSuggestions(false)
                                                }}
                                                className="text-[11px] font-bold bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:opacity-90 transition-all shadow-md"
                                            >
                                                {suggestion}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                <p className="text-[10px] text-muted-foreground ml-1">Usernames must be lowercase and have no spaces.</p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-2">
                        <Button variant="outline" onClick={() => setIsEditing(false)} className="rounded-xl h-11 font-semibold flex-1">Cancel</Button>
                        <Button onClick={handleUpdate} disabled={loading} className="rounded-xl h-11 font-bold flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    )
}
