
import { ingestFromUrl } from "@/services/web-ingest";
import { addKnowledge } from "@/services/knowledge";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { url, content, topic, conversationId } = await req.json();

        if (url) {
            const result = await ingestFromUrl(url, conversationId);
            return NextResponse.json({ success: true, message: `Successfully learned from ${url}`, detail: result });
        }

        if (content && topic) {
            await addKnowledge(`Topic: ${topic}\n\n${content}`, conversationId, { type: "manual_search_result", topic });
            return NextResponse.json({ success: true, message: `Successfully learned about ${topic}` });
        }

        return NextResponse.json({ error: "Provide a URL or content + topic" }, { status: 400 });
    } catch (error: any) {
        console.error("Search & Learn Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
