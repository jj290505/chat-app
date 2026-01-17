
"use client"

import { useState, useEffect } from "react"
import { Brain, Globe, Save, Trash2, Plus, Loader2, Sparkles, Database } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"

interface KnowledgeItem {
    id: number
    content: string
    metadata: any
}

interface BrainManagerProps {
    conversationId?: string | null
}

export default function BrainManager({ conversationId }: BrainManagerProps) {
    const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([])
    const [url, setUrl] = useState("")
    const [manualContent, setManualContent] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(true)

    useEffect(() => {
        fetchKnowledge()
    }, [conversationId])

    const fetchKnowledge = async () => {
        try {
            const url = conversationId
                ? `/api/ai/knowledge?conversationId=${conversationId}`
                : "/api/ai/knowledge"
            const res = await fetch(url)
            const data = await res.json()
            setKnowledge(data)
        } catch (error) {
            console.error("Failed to fetch knowledge:", error)
        } finally {
            setIsFetching(false)
        }
    }

    const handleIngestUrl = async () => {
        if (!url) return
        setIsLoading(true)
        try {
            const res = await fetch("/api/ai/knowledge/search-and-learn", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url, conversationId }),
            })
            if (res.ok) {
                setUrl("")
                await fetchKnowledge()
            }
        } catch (error) {
            console.error("Failed to ingest URL:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleIngestManual = async () => {
        if (!manualContent) return
        setIsLoading(true)
        try {
            const res = await fetch("/api/ai/knowledge/ingest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: manualContent, conversationId }),
            })
            if (res.ok) {
                setManualContent("")
                await fetchKnowledge()
            }
        } catch (error) {
            console.error("Failed to ingest manual content:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: number) => {
        try {
            const res = await fetch(`/api/ai/knowledge?id=${id}`, {
                method: "DELETE",
            })
            if (res.ok) {
                setKnowledge(knowledge.filter(k => k.id !== id))
            }
        } catch (error) {
            console.error("Failed to delete knowledge:", error)
        }
    }

    return (
        <div className="flex flex-col h-full bg-background/50 backdrop-blur-xl border-l border-primary/10">
            {/* Header */}
            <div className="p-6 border-b border-primary/10 bg-primary/5">
                <div className="flex items-center gap-2 mb-1">
                    <Brain className="w-5 h-5 text-primary animate-pulse" />
                    <h2 className="text-xl font-bold tracking-tight text-primary">Nexus Brain</h2>
                </div>
                <p className="text-xs text-muted-foreground/80 uppercase tracking-widest">Knowledge Management Core</p>
            </div>

            <ScrollArea className="flex-1 p-6">
                <div className="space-y-8">
                    {/* Ingestion Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <Plus className="w-4 h-4" />
                            <span>Teach New Knowledge</span>
                        </div>

                        {/* URL Ingestion */}
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Enter URL to learn from..."
                                    className="flex-1 bg-background/50 border border-primary/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                />
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-primary/20 hover:bg-primary/10"
                                    onClick={handleIngestUrl}
                                    disabled={isLoading}
                                >
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>

                        {/* Manual Ingestion */}
                        <div className="space-y-2">
                            <textarea
                                placeholder="Paste text or ChatGPT response here..."
                                className="w-full h-24 bg-background/50 border border-primary/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
                                value={manualContent}
                                onChange={(e) => setManualContent(e.target.value)}
                            />
                            <Button
                                size="sm"
                                className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
                                onClick={handleIngestManual}
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                Ingest Knowledge
                            </Button>
                        </div>
                    </div>

                    {/* Knowledge List Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <Database className="w-4 h-4" />
                                <span>Memory Segments</span>
                            </div>
                            <span className="text-[10px] text-primary/60 font-mono tracking-tighter bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
                                {knowledge.length} UNITS LOADED
                            </span>
                        </div>

                        {isFetching ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
                                <p className="text-xs text-muted-foreground animate-pulse">Accessing Neural Database...</p>
                            </div>
                        ) : knowledge.length === 0 ? (
                            <div className="text-center py-12 border border-dashed border-primary/10 rounded-xl bg-primary/5">
                                <Sparkles className="w-8 h-8 text-primary/20 mx-auto mb-3" />
                                <p className="text-sm text-muted-foreground">Brain is currently empty.</p>
                                <p className="text-xs text-muted-foreground/60 mt-1">Provide external resources to begin.</p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {knowledge.map((item) => (
                                    <div
                                        key={item.id}
                                        className="group relative p-4 bg-primary/5 border border-primary/10 rounded-xl hover:border-primary/30 transition-all duration-300"
                                    >
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <p className="text-xs text-foreground/80 line-clamp-3 leading-relaxed">
                                            {item.content}
                                        </p>
                                        <div className="mt-3 flex items-center gap-2">
                                            <div className="h-1 flex-1 bg-primary/10 rounded-full overflow-hidden">
                                                <div className="h-full bg-primary/40 w-full" />
                                            </div>
                                            <span className="text-[9px] text-primary/40 font-mono">SEG-{item.id}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </ScrollArea>

            {/* Footer Stats */}
            <div className="p-4 border-t border-primary/10 bg-primary/5 flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span>NEURAL LINK ACTIVE</span>
                </div>
                <span>v1.0.4-RAG</span>
            </div>
        </div>
    )
}
