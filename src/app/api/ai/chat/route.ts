import { getChatResponseStream } from "@/services/ai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
    try {
        const { messages, currentMessage, userName } = await req.json();

        if (!process.env.GROQ_API_KEY) {
            return NextResponse.json(
                { error: "GROQ_API_KEY is missing" },
                { status: 500 }
            );
        }

        if (!currentMessage) {
            return NextResponse.json(
                { error: "No message provided" },
                { status: 400 }
            );
        }

        const stream = await getChatResponseStream(messages || [], currentMessage, userName || "User");

        const encoder = new TextEncoder();
        const customStream = new ReadableStream({
            async start(controller) {
                for await (const chunk of stream) {
                    if (chunk.choices[0]?.delta?.content) {
                        const text = chunk.choices[0].delta.content;
                        controller.enqueue(encoder.encode(text));
                    }
                }
                controller.close();
            },
        });

        return new Response(customStream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Transfer-Encoding": "chunked",
            },
        });
    } catch (error: any) {
        console.error("AI Route Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to get AI response" },
            { status: 500 }
        );
    }
}