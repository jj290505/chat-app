
import { createClient } from "@supabase/supabase-js";
import { getEmbedding } from "./embeddings";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Note: In production, use service role key for ingestion if possible
const supabase = createClient(supabaseUrl, supabaseKey);

export interface KnowledgeItem {
    id?: number;
    content: string;
    metadata?: any;
    similarity?: number;
}

/**
 * Adds knowledge to the database by generating embeddings and storing them in Supabase.
 */
export async function addKnowledge(content: string, conversationId?: string, metadata: any = {}) {
    const embedding = await getEmbedding(content);

    const { data, error } = await supabase
        .from("knowledge_base")
        .insert({
            content,
            metadata,
            embedding,
            conversation_id: conversationId,
        });

    if (error) {
        console.error("Error adding knowledge:", error);
        throw error;
    }

    return data;
}

/**
 * Searches for relevant knowledge based on a query string.
 */
export async function searchKnowledge(query: string, conversationId?: string, limit: number = 3): Promise<KnowledgeItem[]> {
    const queryEmbedding = await getEmbedding(query);

    const { data, error } = await supabase.rpc("match_documents", {
        query_embedding: queryEmbedding,
        match_threshold: 0.5, // Adjust this as needed
        match_count: limit,
        p_conversation_id: conversationId,
    });

    if (error) {
        console.error("Error searching knowledge:", error);
        throw error;
    }

    return data as KnowledgeItem[];
}

/**
 * Deletes a specific knowledge item.
 */
export async function deleteKnowledge(id: number) {
    const { error } = await supabase
        .from("knowledge_base")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting knowledge:", error);
        throw error;
    }

    return { success: true };
}
