import { getChatResponseStream } from "@/services/ai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
    try {
        const { messages, currentMessage, userName, conversationId } = await req.json();

        if (!process.env.OPENROUTER_API_KEY) {
            return NextResponse.json(
                { error: "OPENROUTER_API_KEY is missing" },
                { status: 500 }
            );
        }

        if (!currentMessage) {
            return NextResponse.json(
                { error: "No message provided" },
                { status: 400 }
            );
        }

        const stream = await getChatResponseStream(messages || [], currentMessage, userName || "User", conversationId);

        const encoder = new TextEncoder();

        const customStream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of stream) {
                        if (chunk.choices[0]?.delta?.content) {
                            const text = chunk.choices[0].delta.content;
                            controller.enqueue(encoder.encode(text));
                        }
                    }
                } catch (err) {
                    console.error("Error during stream iteration:", err);
                } finally {
                    controller.close();
                }
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