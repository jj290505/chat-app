"use client"

import { useState, useEffect } from "react"
import { Settings, User, Camera, Loader2, Check, AlertCircle } from "lucide-react"
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
        const namePart = (formData.full_name || "").toLowerCase().replace(/\s+/g, '_')
        const base = formData.username || namePart || "nexus_user"
        const variants = [
            `${base}_${Math.floor(Math.random() * 1000)}`,
            `${base}_nova`,
            `dev_${base}`,
            `${base}_99`,
            `${base}_prime`
        ]
        await new Promise(resolve => setTimeout(resolve, 600))
        setSuggestions(variants)
        setIsSuggestingUsername(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="sm" className="w-full justify-start gap-2 hover:bg-primary/10">
                        <Settings className="h-4 w-4" />
                        Management Center
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-[2rem] bg-white dark:bg-[#0f1115] border-primary/20 p-0 overflow-hidden shadow-2xl">
                <div className="bg-primary/10 p-6 border-b border-primary/5">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black flex items-center gap-3 text-primary">
                            <div className="p-2 bg-primary/20 rounded-xl">
                                <User className="h-5 w-5" />
                            </div>
                            Core Identity
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground font-bold text-xs uppercase tracking-tight">
                            Configure your presence across the neural network.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6 space-y-8">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group cursor-pointer">
                            <Avatar className="h-32 w-32 border-[6px] border-primary/10 shadow-2xl ring-4 ring-primary/5 transition-all duration-700 group-hover:scale-105 group-hover:rotate-2">
                                <AvatarImage src={formData.avatar_url} />
                                <AvatarFallback className="bg-primary text-white text-5xl font-black">
                                    {(formData.full_name || "U")[0].toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm">
                                <Camera className="h-8 w-8 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/80 flex items-center gap-2">
                                <span className="h-1.5 w-1.5 bg-primary rounded-full animate-pulse" />
                                Neural Handle
                            </Label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black text-lg opacity-40 group-focus-within:opacity-100 transition-opacity">@</span>
                                <Input
                                    id="username"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                                    className="pl-10 h-14 bg-gray-100 dark:bg-white/5 border-2 border-transparent focus:border-primary/30 rounded-2xl transition-all font-bold text-base shadow-inner"
                                    placeholder="handle_01"
                                />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-9 px-4 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10 rounded-xl"
                                    onClick={handleSuggestUsername}
                                    disabled={isSuggestingUsername}
                                >
                                    {isSuggestingUsername ? <Loader2 className="h-3 w-3 animate-spin" /> : "AutoGen"}
                                </Button>
                            </div>

                            {suggestions.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-2 pb-1">
                                    {suggestions.map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => {
                                                setFormData({ ...formData, username: s })
                                                setSuggestions([])
                                            }}
                                            className="text-[10px] px-4 py-2 rounded-xl font-black shadow-lg transition-all active:scale-95"
                                            style={{ backgroundColor: '#2563eb', color: 'white' }}
                                        >
                                            @{s}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/80 flex items-center gap-2">
                                <span className="h-1.5 w-1.5 bg-primary rounded-full animate-pulse" />
                                Display Protocol
                            </Label>
                            <Input
                                id="full_name"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                className="h-14 bg-gray-100 dark:bg-white/5 border-2 border-transparent focus:border-primary/30 rounded-2xl transition-all font-bold text-base px-5 shadow-inner"
                                placeholder="Formal Designation"
                            />
                        </div>
                    </div>

                    {error && (
                        <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-500 rounded-2xl py-4 border-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-xs font-black uppercase tracking-tight ml-2">
                                {error}
                            </AlertDescription>
                        </Alert>
                    )}

                    {success && (
                        <div className="flex items-center gap-4 text-emerald-500 bg-emerald-500/10 border-2 border-emerald-500/20 rounded-2xl p-5 animate-in zoom-in-95 duration-500">
                            <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 shadow-lg">
                                <Check className="h-5 w-5 stroke-[3]" />
                            </div>
                            <p className="text-xs font-black uppercase tracking-[0.1em]">Identity Upgraded!</p>
                        </div>
                    )}

                    <div className="flex gap-4 pt-4">
                        <Button
                            variant="outline"
                            className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all"
                            style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                            onClick={() => setOpen(false)}
                        >
                            Abort
                        </Button>
                        <Button
                            className="flex-[2] h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-300"
                            style={{ backgroundColor: '#059669', color: 'white', border: '2px solid rgba(16, 185, 129, 0.2)' }}
                            onClick={handleSave}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Commit Changes"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
