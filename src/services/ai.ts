import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

// Fetch current news/affairs data (can be enhanced with real API)
async function getCurrentAffairsContext(): Promise<string> {
    try {
        // You can integrate with a news API like NewsAPI, BBC, Reuters, etc.
        // For now, return a placeholder that mentions current date awareness
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
    userName: string = "User"
) {
    const now = new Date();
    const dateTime = now.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });

    const affairsContext = await getCurrentAffairsContext();

    const systemPrompt = `You are Nexus AI, a professional and highly focused AI assistant. 

### Core Instructions:
- **Strict Relevance**: ONLY answer the specific concept or question asked by the user. 
- **Conciseness**: Avoid providing extra knowledge, trivia, or context that was not requested.
- **Accuracy**: Provide precise and accurate information.
- **Formatting**: Use clean markdown (bold, lists, code blocks) to make your answer easy to read.
- **Tone**: Professional, direct, and helpful.

### Limitations:
- Do NOT provide "more knowledge" than what is necessary to answer the user's query.
- Do NOT talk about economics, culture, or other topics unless the user specifically asks about them.

User Information:
- Current User: ${userName}
- Current Time: ${dateTime}
- Location/Timezone context: ${affairsContext}`;

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

    const stream = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: messages,
        stream: true,
    });

    return stream;
}
