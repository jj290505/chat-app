import { ChatMessage } from "./ai";

export async function getGeminiResponseStream(
    history: ChatMessage[],
    currentMessage: string,
    systemPrompt: string
) {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error("GOOGLE_GEMINI_API_KEY is missing");
    }

    // Format messages for Gemini API
    const contents = [
        {
            role: "user",
            parts: [{ text: systemPrompt }]
        },
        ...history.map(msg => ({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content }]
        })),
        {
            role: "user",
            parts: [{ text: currentMessage }]
        }
    ];

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:streamGenerateContent?key=${apiKey}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents,
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 2048,
                },
            }),
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gemini API Error: ${error}`);
    }

    if (!response.body) {
        throw new Error("No response body from Gemini");
    }

    // Parse Gemini's streaming response
    return {
        async *[Symbol.asyncIterator]() {
            const reader = response.body!.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split("\n");
                    buffer = lines.pop() || "";

                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed || trimmed === "[DONE]") continue;

                        try {
                            const data = JSON.parse(trimmed);
                            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

                            if (text) {
                                yield {
                                    choices: [{
                                        delta: { content: text }
                                    }]
                                };
                            }
                        } catch (e) {
                            // Skip invalid JSON
                        }
                    }
                }
            } finally {
                reader.releaseLock();
            }
        }
    };
}
