"use client"

import { useState, useEffect } from "react"
import { Settings, User, Camera, Loader2, Check, AlertCircle, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getCurrentUser, updateProfile } from "@/services/auth"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

interface ProfileSettingsProps {
    trigger?: React.ReactNode;
    onUpdate?: () => void;
}

export default function ProfileSettings({ trigger, onUpdate }: ProfileSettingsProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [isSuggestingUsername, setIsSuggestingUsername] = useState(false)

    const [formData, setFormData] = useState({
        username: "",
        full_name: "",
        avatar_url: "",
    })

    useEffect(() => {
        if (open) {
            const loadUserData = async () => {
                const user = await getCurrentUser()
                if (user) {
                    setFormData({
                        username: user.username || "",
                        full_name: user.name || "",
                        avatar_url: user.avatar_url || "",
                    })
                }
            }
            loadUserData()
            setSuccess(false)
            setError(null)
        }
    }, [open])

    const handleSave = async () => {
        setLoading(true)
        setError(null)
        setSuccess(false)

        try {
            // Simple validation
            if (formData.username.length < 2) {
                throw new Error("Username must be at least 2 characters long")
            }
            if (!/^[a-zA-Z0-9._-]+$/.test(formData.username)) {
                throw new Error("Username can only contain letters, numbers, dots, hyphens, and underscores")
            }

            await updateProfile({
                username: formData.username,
                full_name: formData.full_name,
                avatar_url: formData.avatar_url,
            })

            setSuccess(true)
            onUpdate?.()

            // Dispatch custom event to notify UserProfileCard and other components
            window.dispatchEvent(new Event("profileUpdated"))

            // Close dialog after success
            setTimeout(() => {
                setOpen(false)
            }, 1500)
        } catch (err: any) {
            setError(err.message || "Failed to update profile. Username might already be taken.")
        } finally {
            setLoading(false)
        }
    }

    const handleSuggestUsername = async () => {
        setIsSuggestingUsername(true)
        const base = formData.username || formData.full_name.toLowerCase().replace(/\s+/g, '_') || "user"
        const variants = [
            `${base}_${Math.floor(Math.random() * 1000)}`,
            `${base}_nexora`,
            `the_${base}`,
            `${base}_ai`,
            `${base}_chat`
        ]
        // Simulate a slight delay for "neural" feel
        await new Promise(resolve => setTimeout(resolve, 600))
        setSuggestions(variants)
        setIsSuggestingUsername(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="sm" className="w-full justify-start gap-2 h-10 px-4 rounded-xl hover:bg-white/5 transition-all text-slate-300 hover:text-white group">
                        <Settings className="h-4 w-4 group-hover:rotate-90 transition-transform duration-500" />
                        <span className="font-medium">System Configuration</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[440px] rounded-3xl bg-slate-950/90 backdrop-blur-2xl border-white/10 p-0 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <div className="absolute inset-0 bg-grid-white opacity-10 pointer-events-none"></div>

                <div className="relative z-10 p-8">
                    <DialogHeader className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
                                <User className="h-4 w-4 text-primary" />
                            </div>
                            <DialogTitle className="text-2xl font-black tracking-tight text-white uppercase">Neural Identity</DialogTitle>
                        </div>
                        <DialogDescription className="text-slate-400 text-sm font-medium">
                            Configure your digital presence across the NEXORA Network.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-8">
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-full blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
                                <Avatar className="h-28 w-28 border-4 border-slate-950 shadow-2xl relative z-10">
                                    <AvatarImage src={formData.avatar_url} />
                                    <AvatarFallback className="bg-slate-900 text-primary text-4xl font-black italic">
                                        {(formData.full_name || "U")[0].toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer backdrop-blur-sm">
                                    <Camera className="h-8 w-8 text-white animate-pulse" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-xl flex items-center justify-center border-4 border-slate-950 z-30 shadow-lg">
                                    <Sparkles className="h-4 w-4 text-white" />
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Active Biometric Data</p>
                        </div>

                        <div className="space-y-5">
                            <div className="space-y-2.5">
                                <div className="flex justify-between items-center px-1">
                                    <Label htmlFor="username" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Global Call-Sign</Label>
                                    <span className="text-[10px] font-bold text-primary animate-pulse opacity-70 uppercase tracking-tighter">Verified Link</span>
                                </div>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-bold group-focus-within:text-primary transition-colors">@</span>
                                    <Input
                                        id="username"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                                        className="pl-10 h-14 bg-slate-900/40 border-white/5 rounded-2xl focus:border-primary/40 focus:ring-1 focus:ring-primary/20 text-white font-medium transition-all"
                                        placeholder="cyber_phantom"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 h-9 px-3 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10 rounded-xl transition-all"
                                        onClick={handleSuggestUsername}
                                        disabled={isSuggestingUsername}
                                    >
                                        {isSuggestingUsername ? <Loader2 className="h-3 w-3 animate-spin" /> : "Reroll"}
                                    </Button>
                                </div>

                                {suggestions.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-2 animate-in fade-in slide-in-from-top-2">
                                        {suggestions.map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => {
                                                    setFormData({ ...formData, username: s })
                                                    setSuggestions([])
                                                }}
                                                className="text-[10px] px-3 py-1.5 rounded-xl bg-primary/5 border border-primary/10 hover:border-primary/30 transition-all text-primary/80 font-bold hover:text-primary"
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2.5">
                                <Label htmlFor="full_name" className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Display Designation</Label>
                                <Input
                                    id="full_name"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    className="h-14 bg-slate-900/40 border-white/5 rounded-2xl focus:border-primary/40 focus:ring-1 focus:ring-primary/20 text-white font-medium transition-all"
                                    placeholder="Neural Architect"
                                />
                            </div>
                        </div>

                        {error && (
                            <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-400 rounded-2xl py-3 border">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="text-xs font-bold uppercase tracking-wide">
                                    Connection Error: {error}
                                </AlertDescription>
                            </Alert>
                        )}

                        {success && (
                            <div className="flex items-center gap-3 text-green-400 bg-green-500/10 border border-green-500/20 rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-2">
                                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                                    <Check className="h-3 w-3" />
                                </div>
                                <p className="text-xs font-black uppercase tracking-widest">Neural pattern successfully synced.</p>
                            </div>
                        )}

                        <div className="flex gap-4 pt-4 pb-8">
                            <Button
                                variant="outline"
                                className="flex-1 h-14 rounded-2xl border-white/5 text-slate-400 hover:bg-white/5 hover:text-white transition-all font-bold uppercase tracking-widest text-xs"
                                onClick={() => setOpen(false)}
                            >
                                Discard
                            </Button>
                            <Button
                                className="flex-1 h-14 rounded-2xl btn-neon-purple font-black uppercase tracking-widest text-xs"
                                onClick={handleSave}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Commit Changes"}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
