import Groq from "groq-sdk";
// import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAvailableMCPTools, executeMCPTool } from "./mcp-supabase";
import { getWebSearchMCPTools, executeWebSearchMCPTool } from "./mcp-web-search";
import { getUtilityMCPTools, executeUtilityMCPTool } from "./mcp-utilities";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

// Gemini setup commented out
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface ChatMessage {
    role: "user" | "assistant" | "system" | "tool";
    content: string;
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

    const systemPrompt = `You are a highly accurate, helpful, and intelligent AI assistant for a real-time chat application.
User: ${userName} | Time: ${dateTime}

STRICT RULES:
1) Answer the user's question directly.
2) If you need data (weather, news, db, stock price), output the <TOOL> command immediately. Do NOT say "I will check..." first. Just output the tool.
3) After receiving the Tool Result, provide the final answer to the user in English.
4) **FOR TECH, SPORTS, & MARKETS:** Provide COMPREHENSIVE details. do not summarize briefly. Use bullet points, bold text for values, and show the full picture.
5) Never hallucinate facts.

RESPONSE FORMAT:
- If you need to use a tool, output ONLY the tool command.
- If you have the data, output the final answer in friendly, detailed English.

TOOLS AND PARAMETERS:
${databaseToolsInfo}
${webSearchToolsInfo}
${utilityToolsInfo}

TOOL SYNTAX:
<TOOL>tool_name</TOOL>
<PARAMS>{"param_name": "value"}</PARAMS>

EXAMPLES:
User: "Weather in Delhi?"
Assistant: <TOOL>get_weather</TOOL><PARAMS>{"location": "Delhi"}</PARAMS>

User: "Gold price?"
Assistant: <TOOL>get_financial_data</TOOL><PARAMS>{"symbol": "GOLD", "type": "stock"}</PARAMS>

User: "Bitcoin price?"
Assistant: <TOOL>get_financial_data</TOOL><PARAMS>{"symbol": "BTC", "type": "crypto"}</PARAMS>

User: "Latest tech news?"
Assistant: <TOOL>get_news</TOOL><PARAMS>{"topic": "technology"}</PARAMS>

User: "Sports updates?"
Assistant: <TOOL>get_news</TOOL><PARAMS>{"topic": "sports"}</PARAMS>`;

    let messages: any[] = [
        { role: "system", content: systemPrompt },
        ...history.map((msg) => ({ role: msg.role, content: msg.content })),
        { role: "user", content: currentMessage },
    ];

    // Create a generator that handles multi-turn loop
    return streamWithTools(messages);
}

async function* streamWithTools(messages: any[]): AsyncGenerator<any, void, unknown> {
    let keepGoing = true;
    let turnCount = 0;
    const MAX_TURNS = 5;

    while (keepGoing && turnCount < MAX_TURNS) {
        turnCount++;

        console.log(`[AI] Turn ${turnCount} started`);

        try {
            const stream = await groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: messages,
                stream: true,
            });

            let fullResponse = "";
            let toolCallBuffer = "";
            let isToolCall = false;

            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || "";
                fullResponse += content;

                // Check if we are potentially starting a tool call
                if (content.includes("<TOOL>") || toolCallBuffer.includes("<TOOL>")) {
                    isToolCall = true;
                    toolCallBuffer += content;
                } else if (!isToolCall) {
                    // Yield normal text immediately
                    yield chunk;
                } else {
                    toolCallBuffer += content;
                }
            }

            // Post-processing the full response of this turn
            const toolMatch = fullResponse.match(/<TOOL>([^<]+)<\/TOOL>\s*<PARAMS>([\s\S]*?)<\/PARAMS>/);

            if (toolMatch) {
                const [fullMatch, toolName, paramsStr] = toolMatch;
                isToolCall = true;

                // Notify UI that we are working
                yield { choices: [{ delta: { content: `\n\n*Checking ${toolName}...*\n\n` } }] };

                try {
                    const params = JSON.parse(paramsStr);
                    console.log(`[MCP] Executing tool: ${toolName}`, params);

                    let toolResult = "";
                    if (["search_knowledge_base", "get_user_conversations", "search_contacts", "get_recent_messages", "store_knowledge"].includes(toolName)) {
                        toolResult = await executeMCPTool(toolName, params);
                    } else if (["web_search", "fetch_web_content", "get_trending_topics", "get_weather", "get_financial_data", "get_news", "get_current_datetime"].includes(toolName)) {
                        toolResult = await executeWebSearchMCPTool(toolName, params);
                    } else if (["math_calculate", "unit_converter", "data_statistics", "json_formatter", "text_statistics"].includes(toolName)) {
                        toolResult = await executeUtilityMCPTool(toolName, params);
                    } else {
                        toolResult = `Tool "${toolName}" not found`;
                    }

                    console.log(`[MCP] Result:`, toolResult.substring(0, 50));

                    // Append the assistant's request and the tool's result to history
                    messages.push({ role: "assistant", content: fullResponse });
                    messages.push({ role: "user", content: `Tool Result for ${toolName}:\n${toolResult}\n\nBased on this result, please provide the final answer to the user.` });

                    // Loop continues to next iteration to get the final answer
                    keepGoing = true;

                } catch (error: any) {
                    console.error(`[MCP] Tool Execution Error:`, error);
                    messages.push({ role: "system", content: `Tool error: ${error.message}` });
                    keepGoing = true;
                }
            } else {
                // No tool found, this is the final answer
                // If we buffered potential tool text but it wasn't a valid tool, yield it now
                if (isToolCall && toolCallBuffer) {
                    yield { choices: [{ delta: { content: toolCallBuffer } }] };
                }
                keepGoing = false;
            }
        } catch (error: any) {
            console.error("Groq Error:", error);
            yield { choices: [{ delta: { content: `\n\n(AI Error: ${error.message})` } }] };
            keepGoing = false;
        }
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
