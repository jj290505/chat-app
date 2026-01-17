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
            if (formData.username.length < 3) {
                throw new Error("Username must be at least 3 characters long")
            }
            if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
                throw new Error("Username can only contain letters, numbers, and underscores")
            }

            await updateProfile({
                username: formData.username,
                full_name: formData.full_name,
                avatar_url: formData.avatar_url,
            })

            setSuccess(true)
            onUpdate?.()
            setTimeout(() => setOpen(false), 1500)
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
            `${base}_nexus`,
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
                    <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                        <Settings className="h-4 w-4" />
                        Profile Settings
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-2xl bg-background/95 backdrop-blur-xl border-primary/10">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        Personal Identity
                    </DialogTitle>
                    <DialogDescription>
                        Customize your presence in the Nexus. Your username is how others find you.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group">
                            <Avatar className="h-24 w-24 border-4 border-primary/10 shadow-xl">
                                <AvatarImage src={formData.avatar_url} />
                                <AvatarFallback className="bg-primary/5 text-primary text-3xl font-bold">
                                    {(formData.full_name || "U")[0].toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <Camera className="h-6 w-6 text-white" />
                            </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                            Profile Avatar
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-xs font-bold uppercase tracking-wider opacity-70">
                                Global Username
                            </Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">@</span>
                                <Input
                                    id="username"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                                    className="pl-8 bg-muted/30 border-primary/10 rounded-xl focus-visible:ring-primary/20"
                                    placeholder="cyber_jockey"
                                />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary/5"
                                    onClick={handleSuggestUsername}
                                    disabled={isSuggestingUsername}
                                >
                                    {isSuggestingUsername ? <Loader2 className="h-3 w-3 animate-spin" /> : "Suggest"}
                                </Button>
                            </div>

                            {suggestions.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-1 animate-in fade-in slide-in-from-top-1">
                                    {suggestions.map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => {
                                                setFormData({ ...formData, username: s })
                                                setSuggestions([])
                                            }}
                                            className="text-[10px] px-2 py-1 rounded-full bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors text-primary font-medium"
                                        >
                                            @{s}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="full_name" className="text-xs font-bold uppercase tracking-wider opacity-70">
                                Display Name
                            </Label>
                            <Input
                                id="full_name"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                className="bg-muted/30 border-primary/10 rounded-xl focus-visible:ring-primary/20"
                                placeholder="Your Name"
                            />
                        </div>
                    </div>

                    {error && (
                        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive rounded-xl py-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-xs font-medium">
                                {error}
                            </AlertDescription>
                        </Alert>
                    )}

                    {success && (
                        <div className="flex items-center gap-2 text-green-500 bg-green-500/10 border border-green-500/20 rounded-xl p-3 animate-in fade-in slide-in-from-bottom-2">
                            <Check className="h-4 w-4" />
                            <p className="text-xs font-bold">Neural pattern updated successfully!</p>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <Button
                            variant="outline"
                            className="flex-1 rounded-xl"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="flex-1 rounded-xl shadow-lg shadow-primary/20"
                            onClick={handleSave}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
