"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { Loader2, User, AtSign, Save } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ProfileSettingsModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onProfileUpdated?: () => void
}

export default function ProfileSettingsModal({ open, onOpenChange, onProfileUpdated }: ProfileSettingsModalProps) {
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        full_name: "",
        username: "",
        avatar_url: "",
    })

    const supabase = createClient()

    useEffect(() => {
        if (open) {
            loadProfile()
        }
    }, [open])

    const loadProfile = async () => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", user.id)
                    .single()

                if (data) {
                    setFormData({
                        full_name: data.full_name || "",
                        username: data.username || "",
                        avatar_url: data.avatar_url || "",
                    })
                }
            }
        } catch (error) {
            console.error("Error loading profile:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("No user found")

            const updates = {
                id: user.id,
                ...formData,
                // updated_at: new Date().toISOString(), // Column missing in DB, removing to fix save error
            }

            const { error } = await supabase.from("profiles").upsert(updates)
            if (error) throw error

            // Trigger global event for components to reload
            window.dispatchEvent(new Event("profileUpdated"))

            if (onProfileUpdated) onProfileUpdated()
            onOpenChange(false)
        } catch (error) {
            console.error("Error saving profile:", error)
            alert(`Failed to save profile: ${(error as any).message}`)
        } finally {
            setSaving(false)
        }
    }

    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true)
            if (!event.target.files || event.target.files.length === 0) {
                return
            }
            const file = event.target.files[0]
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random()}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file)

            if (uploadError) {
                throw uploadError
            }

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)

            setFormData(prev => ({ ...prev, avatar_url: data.publicUrl }))
        } catch (error) {
            console.error('Error uploading avatar:', error)
            alert('Error uploading avatar!')
        } finally {
            setUploading(false)
        }
    }

    const generateRandomUsername = () => {
        const adjectives = ['Cyber', 'Neon', 'Techno', 'Digital', 'Flux', 'Quantum', 'Hyper', 'Sonic', 'Glitch', 'Pixel']
        const nouns = ['Ninja', 'Pilot', 'Surfer', 'Ghost', 'Runner', 'Walker', 'Wolf', 'Hawk', 'Bot', 'Phantom']
        const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)]
        const randomNoun = nouns[Math.floor(Math.random() * nouns.length)]
        const randomNumber = Math.floor(Math.random() * 1000)

        const username = `${randomAdjective}${randomNoun}${randomNumber}`.toLowerCase()
        setFormData(prev => ({ ...prev, username }))
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-slate-900 border-white/10 text-white sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <User className="w-5 h-5 text-primary" />
                        Profile Settings
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Update your digital identity on NEXORA.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="grid gap-6 py-4">
                        <div className="flex justify-center mb-2">
                            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <input
                                    type="file"
                                    hidden
                                    ref={fileInputRef}
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={uploading}
                                />
                                <Avatar className="h-24 w-24 border-2 border-primary/20 group-hover:border-primary/50 transition-all">
                                    <AvatarImage src={formData.avatar_url} className="object-cover" />
                                    <AvatarFallback className="bg-slate-800 text-3xl font-bold text-primary">
                                        {formData.full_name?.[0]?.toUpperCase() || "U"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    {uploading ? (
                                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                                    ) : (
                                        <span className="text-xs font-bold text-white uppercase tracking-widest">Upload</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-slate-500">
                                Display Name
                            </Label>
                            <div className="relative">
                                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                <Input
                                    id="name"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    className="pl-9 bg-slate-950/50 border-white/10 focus:border-primary/50"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="username" className="text-xs font-bold uppercase tracking-widest text-slate-500">
                                Username
                            </Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <AtSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                    <Input
                                        id="username"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        className="pl-9 bg-slate-950/50 border-white/10 focus:border-primary/50"
                                        placeholder="johndoe"
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="border-white/10 hover:bg-white/5 hover:text-primary transition-colors text-xs font-bold uppercase"
                                    onClick={generateRandomUsername}
                                >
                                    Suggest
                                </Button>
                            </div>
                        </div>

                        {/* Removed manual URL input in favor of upload */}
                    </div>
                )}

                <DialogFooter className="gap-2">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="hover:bg-white/5">
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving || loading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
