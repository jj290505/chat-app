import { NextRequest, NextResponse } from "next/server";
import { getCompletion } from "@/services/ai";

export async function POST(req: NextRequest) {
    try {
        const { text } = await req.json();

        if (!text || text.length < 3) {
            return NextResponse.json({ suggestion: "" });
        }

        const suggestion = await getCompletion(text);

        return NextResponse.json({ suggestion });
    } catch (error) {
        console.error("Suggest API error:", error);
        return NextResponse.json({ suggestion: "" }, { status: 500 });
    }
}
