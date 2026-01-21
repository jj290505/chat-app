import Groq from "groq-sdk";
import { getAvailableMCPTools, executeMCPTool } from "./mcp-supabase";
import { getWebSearchMCPTools, executeWebSearchMCPTool } from "./mcp-web-search";
import { getUtilityMCPTools, executeUtilityMCPTool } from "./mcp-utilities";

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
        const currentDate = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        return `As of ${currentDate}, you have knowledge of current events and world affairs. Acknowledge your knowledge cutoff date respectfully if asked about very recent events.`;
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

    // Get ALL MCP Tools Information
    const databaseTools = getAvailableMCPTools();
    const webSearchTools = getWebSearchMCPTools();
    const utilityTools = getUtilityMCPTools();

    const databaseToolsInfo = databaseTools.map((tool) => `- **${tool.name}**: ${tool.description}`).join("\n");
    const webSearchToolsInfo = webSearchTools.map((tool) => `- **${tool.name}**: ${tool.description}`).join("\n");
    const utilityToolsInfo = utilityTools.map((tool) => `- **${tool.name}**: ${tool.description}`).join("\n");

    const systemPrompt = `You are a highly accurate, helpful, and intelligent AI assistant for a real-time chat application (WhatsApp-style UI + Instagram-like chat structure + AI assistant features).
User: ${userName} | Time: ${dateTime}

STRICT RULES (MUST FOLLOW):
1) DO NOT introduce yourself. Never say “Namaste! I am your AI assistant” or explain your capabilities.
2) DO NOT write generic templates like: “My abilities”, “How I work”, “Conclusion”, “Example section” unless the user asks.
3) Answer the user’s question directly and practically.
4) If the user’s question is unclear or missing details, ask ONLY 1 short clarification question.
5) Never hallucinate or invent facts. If unsure, say: “I’m not fully sure” and suggest a safe next step.
6) Keep responses short, clear, and structured. Prefer bullets and step-by-step instructions.

7) Write in natural Hinglish (Hindi + English mix), friendly but professional.
8) For coding questions: give working code + brief explanation + best practices.
9) For long topics: first give a 1-line summary, then detailed steps.
10) Do not repeat the same information again and again. Avoid filler text.

RESPONSE FORMAT (DEFAULT):
- First line: short direct answer (1–2 lines)
- Then: steps/bullets
- Then: example (only if useful)

SPECIAL CHAT BEHAVIOR:
- If user says “Hi / Hello / Namaste”, reply only: “Hi! Batao kya help chahiye? 🙂”
- If user asks for “best model”, “best prompt”, “best setup”, give clear recommendations with reasons.

GOAL:
Your responses must feel like ChatGPT: accurate, helpful, structured, and human-like.

### 🛠️ CORE CAPABILITIES & TOOLS
You have access to 15 specialized tools. Use them to provide accurate, real-time information:
- **Database**: search_knowledge_base, get_user_conversations, search_contacts, get_recent_messages, store_knowledge
- **Web**: web_search, fetch_web_content, get_trending_topics, get_weather, get_current_datetime
- **Utilities**: math_calculate, unit_converter, data_statistics, json_formatter, text_statistics

**TOOL FORMAT:**
<TOOL>tool_name</TOOL>
<PARAMS>{"param": "value"}</PARAMS>`;

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

    return processStreamWithMCPTools(stream);
}

async function* processStreamWithMCPTools(
    stream: AsyncIterable<any>
): AsyncIterable<any> {
    let buffer = "";

    for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        buffer += content;

        const toolMatch = buffer.match(/<TOOL>([^<]+)<\/TOOL>\s*<PARAMS>([\s\S]*?)<\/PARAMS>/);

        if (toolMatch) {
            const [fullMatch, toolName, paramsStr] = toolMatch;

            try {
                const params = JSON.parse(paramsStr);
                console.log(`[MCP] Executing tool: ${toolName}`);

                let toolResult: string;

                if (["search_knowledge_base", "get_user_conversations", "search_contacts", "get_recent_messages", "store_knowledge"].includes(toolName)) {
                    toolResult = await executeMCPTool(toolName, params);
                } else if (["web_search", "fetch_web_content", "get_trending_topics", "get_weather", "get_current_datetime"].includes(toolName)) {
                    toolResult = await executeWebSearchMCPTool(toolName, params);
                } else if (["math_calculate", "unit_converter", "data_statistics", "json_formatter", "text_statistics"].includes(toolName)) {
                    toolResult = await executeUtilityMCPTool(toolName, params);
                } else {
                    toolResult = `Tool "${toolName}" not found`;
                }

                buffer = buffer.replace(fullMatch, `\n\n📊 **[Tool: ${toolName}]** \n${toolResult}\n\n`);
            } catch (error) {
                console.error(`[MCP] Tool error:`, error);
                buffer = buffer.replace(fullMatch, `\n\n❌ **[Tool Error]** Failed to execute ${toolName}\n\n`);
            }
        }
        yield chunk;
    }
}

export async function getCompletion(text: string): Promise<string> {
    try {
        const message = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: `Complete this text briefly: "${text}"` }],
            max_tokens: 150,
        });
        return message.choices[0]?.message?.content || text;
    } catch (error) {
        console.error("Error getting completion:", error);
        return text;
    }
}
