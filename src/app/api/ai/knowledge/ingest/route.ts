
import { addKnowledge } from "@/services/knowledge";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { content, metadata, conversationId } = await req.json();

        if (!content) {
            return NextResponse.json({ error: "Content is required" }, { status: 400 });
        }

        await addKnowledge(content, conversationId, metadata || {});

        return NextResponse.json({ success: true, message: "Knowledge added successfully" });
    } catch (error: any) {
        console.error("Knowledge Ingestion Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
