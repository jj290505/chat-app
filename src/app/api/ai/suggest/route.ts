import { NextRequest, NextResponse } from "next/server";
import { getCompletion } from "@/services/ai";

export async function POST(req: NextRequest) {
    try {
        const { text } = await req.json();

        if (!text || text.length < 10) {
            return NextResponse.json({ suggestion: "" });
        }

        // Force conciseness by asking for only the completion
        const completion = await getCompletion(`Complete this sentence exactly, no quotes/explanations: "${text}"`);

        // simple heuristic to remove the original text if AI repeats it
        const cleanSuggestion = completion.replace(text, "").trim();

        return NextResponse.json({ suggestion: cleanSuggestion });
    } catch (error) {
        console.error("Suggest API error:", error);
        return NextResponse.json({ suggestion: "" }, { status: 500 });
    }
}
