"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Chrome, Shield, Zap, Lock, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export default function AuthPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [fullName, setFullName] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const supabase = createClient()
    const router = useRouter()

    const handleEmailAuth = async (type: "login" | "signup") => {
        setLoading(true)
        setError(null)

        try {
            if (type === "signup") {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                        }
                    }
                })
                if (error) throw error
                setError("Check your email for confirmation link!")
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                })
                if (error) throw error
                router.push("/chat")
                router.refresh()
            }
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleLogin = async () => {
        const origin = window.location.origin
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${origin}/auth/callback`
            }
        })
        if (error) setError(error.message)
    }

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-slate-950 font-sans selection:bg-primary/30">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-grid-white pointer-events-none opacity-20"></div>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse-glow"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: '1.5s' }}></div>

            {/* Scanline Effect */}
            <div className="absolute inset-0 pointer-events-none z-10">
                <div className="w-full h-full bg-transparent overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent h-24 w-full animate-scanline"></div>
                </div>
            </div>

            <div className="relative z-20 w-full max-w-lg p-4">
                <div className="flex flex-col items-center mb-8 animate-float">
                    <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30 shadow-[0_0_20px_rgba(139,92,246,0.3)] mb-4">
                        <Zap className="h-8 w-8 text-primary animate-pulse" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-white text-glow-purple">NEXORA</h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em] mt-2 opacity-70">AI Chat Assistant</p>
                </div>

                <div className="glass-panel p-8 rounded-3xl relative overflow-hidden group">
                    {/* Decorative corner accents */}
                    <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-primary/40 rounded-tl-3xl"></div>
                    <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-accent/40 rounded-br-3xl"></div>

                    <Tabs defaultValue="login" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-slate-900/50 p-1.5 rounded-2xl mb-8 border border-white/5">
                            <TabsTrigger
                                value="login"
                                className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
                            >
                                Login
                            </TabsTrigger>
                            <TabsTrigger
                                value="signup"
                                className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
                            >
                                Sign Up
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="login" className="mt-0">
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                                        <div className="relative group">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
                                                <Shield className="h-4 w-4" />
                                            </div>
                                            <Input
                                                type="email"
                                                placeholder="identity@nexora.ai"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="pl-10 h-12 rounded-xl bg-slate-950/50 border-white/5 focus:border-primary/50 text-white placeholder:text-slate-600 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
                                        <div className="relative group">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
                                                <Lock className="h-4 w-4" />
                                            </div>
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="pl-10 h-12 rounded-xl bg-slate-950/50 border-white/5 focus:border-primary/50 text-white placeholder:text-slate-600 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <Button
                                        className="w-full h-12 rounded-xl btn-neon-purple font-bold tracking-wide text-lg"
                                        onClick={() => handleEmailAuth("login")}
                                        disabled={loading}
                                    >
                                        {loading ? "Logging in..." : "Login"}
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="signup" className="mt-0">
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                                        <div className="relative group">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
                                                <User className="h-4 w-4" />
                                            </div>
                                            <Input
                                                type="text"
                                                placeholder="John Doe"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                className="pl-10 h-12 rounded-xl bg-slate-950/50 border-white/5 focus:border-primary/50 text-white placeholder:text-slate-600 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                                        <div className="relative group">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
                                                <Shield className="h-4 w-4" />
                                            </div>
                                            <Input
                                                type="email"
                                                placeholder="identity@nexora.ai"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="pl-10 h-12 rounded-xl bg-slate-950/50 border-white/5 focus:border-primary/50 text-white placeholder:text-slate-600 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
                                        <div className="relative group">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
                                                <Lock className="h-4 w-4" />
                                            </div>
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="pl-10 h-12 rounded-xl bg-slate-950/50 border-white/5 focus:border-primary/50 text-white placeholder:text-slate-600 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <Button
                                        className="w-full h-12 rounded-xl btn-neon-purple font-bold tracking-wide text-lg"
                                        onClick={() => handleEmailAuth("signup")}
                                        disabled={loading}
                                    >
                                        {loading ? "Creating Account..." : "Sign Up"}
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    {error && (
                        <div className="mt-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-bold text-center animate-in fade-in slide-in-from-top-2">
                            ⚠️ {error}
                        </div>
                    )}

                    <div className="relative my-10">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/5" />
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em]">
                            <span className="bg-slate-950 px-4 text-slate-500 font-bold backdrop-blur-sm">
                                Or continue with
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <Button
                            variant="outline"
                            className="h-12 rounded-xl border-white/5 hover:bg-white/5 hover:border-primary/30 transition-all flex items-center justify-center gap-3 font-bold group"
                            onClick={handleGoogleLogin}
                        >
                            <Chrome className="h-5 w-5 group-hover:text-primary transition-colors" />
                            <span className="text-slate-300">Continue with Google</span>
                        </Button>

                        <Button
                            variant="ghost"
                            className="h-10 rounded-xl text-slate-500 hover:text-primary hover:bg-transparent transition-colors text-xs font-bold uppercase tracking-widest"
                            onClick={() => router.push("/chat")}
                        >
                            Continue as Guest
                        </Button>
                    </div>
                </div>

                <div className="mt-8 text-center px-4">
                    <p className="text-[10px] text-slate-600 font-medium uppercase tracking-widest leading-relaxed">
                        By establishing connection, you agree to the <br />
                        <span className="text-slate-500 cursor-pointer hover:text-primary transition-colors underline underline-offset-4 decoration-slate-800">Terms of Service</span> & <span className="text-slate-500 cursor-pointer hover:text-primary transition-colors underline underline-offset-4 decoration-slate-800">Privacy Policy</span>
                    </p>
                </div>
            </div>
        </div>
    )
}
