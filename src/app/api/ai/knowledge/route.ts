
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const conversationId = searchParams.get("conversationId");

        let query = supabase
            .from("knowledge_base")
            .select("id, content, metadata")
            .order("id", { ascending: false });

        if (conversationId) {
            query = query.eq("conversation_id", conversationId);
        } else {
            // If no conversationId is provided, we might want to return global knowledge 
            // or nothing. For now, let's only return items with NULL conversation_id if not specified
            // to avoid leaking per-chat knowledge.
            query = query.is("conversation_id", null);
        }

        const { data, error } = await query;

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Fetch Knowledge Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        const { error } = await supabase
            .from("knowledge_base")
            .delete()
            .eq("id", id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Delete Knowledge Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
