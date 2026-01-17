import { searchKnowledge } from "./knowledge";

export interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

// Fetch current news/affairs data (can be enhanced with real API)
async function getCurrentAffairsContext(): Promise<string> {
    try {
        const currentDate = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        return `As of ${currentDate}, you have knowledge of current events and world affairs. You should be aware of major global events, news, and current affairs up to your knowledge cutoff. If asked about very recent events (last few days), acknowledge your knowledge cutoff date respectfully.`;
    } catch (error) {
        console.error("Error fetching current affairs context:", error);
        return "You have general knowledge of world affairs and current events.";
    }
}

export async function getChatResponseStream(
    history: ChatMessage[],
    currentMessage: string,
    userName: string = "User",
    conversationId?: string
) {
    // Parallelize pre-stream lookups
    const [affairsContext, brainResults] = await Promise.all([
        getCurrentAffairsContext(),
        searchKnowledge(currentMessage, conversationId, 3).catch(err => {
            console.error("Error searching brain knowledge:", err);
            return [];
        })
    ]);

    const brainKnowledge = brainResults.length > 0
        ? brainResults.map(r => `- ${r.content}`).join("\n")
        : "";

    const systemPrompt = `You are Nexus AI, a professional and highly focused AI assistant powered by a powerful large language model. 

### Core Instructions:
- **Strict Relevance**: ONLY answer the specific concept or question asked by the user. 
- **Conciseness**: Avoid providing extra knowledge, trivia, or context that was not requested.
- **Accuracy**: Provide precise and accurate information.
- **Brain Knowledge**: You have access to a private "brain" of resources. If relevant knowledge is provided below, use it to enhance your answer.
- **Formatting**: Use clean markdown (bold, lists, code blocks) to make your answer easy to read.
- Tone: Professional, direct, and helpful.

${brainKnowledge ? `### Brain Knowledge (Use this for your answer):\n${brainKnowledge}\n` : ""}

### Limitations:
- Do NOT provide "more knowledge" than what is necessary to answer the user's query.
- Do NOT talk about economics, culture, or other topics unless the user specifically asks about them.

User Information:
- Current User: ${userName}
- Current Time: ${new Date().toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    })}
- Context: ${affairsContext}`;

    const messages = [
        {
            role: "system" as const,
            content: systemPrompt,
        },
        ...history.map((msg) => ({
            role: msg.role,
            content: msg.content,
        })),
        {
            role: "user" as const,
            content: currentMessage,
        },
    ];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://nexus-chat.app", // Optional for OpenRouter
            "X-Title": "Nexus Chat", // Optional for OpenRouter
        },
        body: JSON.stringify({
            model: "meta-llama/llama-3.3-70b-instruct:free",
            messages: messages,
            stream: true,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenRouter Error: ${error}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let leftOver = "";

    return {
        async *[Symbol.asyncIterator]() {
            while (true) {
                const { done, value } = await reader!.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const combined = leftOver + chunk;
                const lines = combined.split("\n");

                // Keep the last part if it doesn't end with a newline
                leftOver = lines.pop() || "";

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine) continue;

                    if (trimmedLine.startsWith("data: ")) {
                        const data = trimmedLine.slice(6).trim();
                        if (data === "[DONE]") return;
                        try {
                            const parsed = JSON.parse(data);
                            yield parsed;
                        } catch (e) {
                            console.error("Error parsing JSON chunk:", e, "Line:", trimmedLine);
                        }
                    }
                }
            }
        }
    };
}

export async function getCompletion(text: string): Promise<string> {
    if (!text || text.length < 5) return "";

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "meta-llama/llama-3.2-3b-instruct:free", // Use a small, fast model for suggestions
                messages: [
                    {
                        role: "system",
                        content: "You are a text completion assistant. Complete the user's sentence briefly. ONLY return the completion text, no quotes or intro. If no good completion, return empty string."
                    },
                    {
                        role: "user",
                        content: text
                    }
                ],
                max_tokens: 10,
                temperature: 0.1,
            }),
        });

        if (!response.ok) return "";

        const data = await response.json();
        return data.choices?.[0]?.message?.content || "";
    } catch (error) {
        console.error("Suggestion error:", error);
        return "";
    }
}
