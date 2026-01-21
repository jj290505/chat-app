/**
 * MCP (Model Context Protocol) Server for Supabase
 * This file provides database query tools that your AI can use
 * 
 * Think of it as "giving AI superpowers" to:
 * - Query conversations
 * - Search the knowledge base
 * - Find contacts
 * - Get user information
 */

import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// MCP Tool Definitions (What AI can do)
// ============================================

export interface MCPTool {
  name: string;
  description: string;
  execute: (params: any) => Promise<string>;
}

/**
 * Tool 1: Search Knowledge Base
 * AI can search your knowledge base to find relevant information using Neural Vector Search
 */
const searchKnowledgeTool: MCPTool = {
  name: "search_knowledge_base",
  description: "Search the knowledge base for relevant information using semantic vector search. Returns matching documents.",
  execute: async (params: { query: string; limit?: number }) => {
    try {
      const { query, limit = 5 } = params;

      // Import dynamically to avoid circular dependencies if any
      const { searchKnowledge } = await import("./knowledge");

      const results = await searchKnowledge(query, undefined, limit);

      if (!results || results.length === 0) {
        return "No relevant knowledge found.";
      }

      const formattedResults = results
        .map((item: any) => `- ${item.content} (Relevance: ${Math.round((item.similarity || 0) * 100)}%)`)
        .join("\n\n");

      return `Found ${results.length} relevant entries:\n${formattedResults}`;
    } catch (error: any) {
      return `Error searching knowledge base: ${error.message}`;
    }
  },
};

/**
 * Tool 2: Get User Conversations
 * AI can retrieve past conversations for context
 */
const getUserConversationsTool: MCPTool = {
  name: "get_user_conversations",
  description: "Retrieve a user's recent conversations. Helps AI understand conversation history.",
  execute: async (params: { userId: string; limit?: number }) => {
    try {
      const { userId, limit = 5 } = params;

      const { data, error } = await supabase
        .from("conversations")
        .select("id, title, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      if (!data || data.length === 0) {
        return "No conversations found for this user.";
      }

      const results = data
        .map((conv: any) => `- ${conv.title} (${conv.created_at})`)
        .join("\n");

      return `User's recent conversations:\n${results}`;
    } catch (error: any) {
      return `Error fetching conversations: ${error.message}`;
    }
  },
};

/**
 * Tool 3: Search User Contacts
 * AI can find contacts by name or email
 */
const searchContactsTool: MCPTool = {
  name: "search_contacts",
  description: "Search for contacts by name or email. Returns matching contact information.",
  execute: async (params: { query: string; userId?: string }) => {
    try {
      const { query, userId } = params;

      let queryBuilder = supabase
        .from("contacts")
        .select("id, username, email")
        .or(`username.ilike.%${query}%,email.ilike.%${query}%`);

      if (userId) {
        queryBuilder = queryBuilder.eq("user_id", userId);
      }

      const { data, error } = await queryBuilder.limit(10);

      if (error) throw error;

      if (!data || data.length === 0) {
        return "No contacts found matching that search.";
      }

      const results = data
        .map((contact: any) => `- ${contact.username} (${contact.email})`)
        .join("\n");

      return `Found ${data.length} contacts:\n${results}`;
    } catch (error: any) {
      return `Error searching contacts: ${error.message}`;
    }
  },
};

/**
 * Tool 4: Get Recent Messages
 * AI can see recent chat messages for context
 */
const getRecentMessagesTool: MCPTool = {
  name: "get_recent_messages",
  description: "Get recent messages from a conversation for context.",
  execute: async (params: { conversationId: string; limit?: number }) => {
    try {
      const { conversationId, limit = 10 } = params;

      const { data, error } = await supabase
        .from("messages")
        .select("id, role, content, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      if (!data || data.length === 0) {
        return "No messages found in this conversation.";
      }

      const results = data
        .reverse() // Show oldest first
        .map((msg: any) => `${msg.role.toUpperCase()}: ${msg.content.substring(0, 100)}...`)
        .join("\n");

      return `Recent messages from conversation:\n${results}`;
    } catch (error: any) {
      return `Error fetching messages: ${error.message}`;
    }
  },
};

/**
 * Tool 5: Store New Knowledge
 * AI can save learned information to knowledge base with embeddings
 */
const storeKnowledgeTool: MCPTool = {
  name: "store_knowledge",
  description: "Save new information to the knowledge base for future reference.",
  execute: async (params: { content: string; metadata?: any; conversationId?: string }) => {
    try {
      const { content, metadata = {}, conversationId } = params;

      // Import dynamically
      const { addKnowledge } = await import("./knowledge");

      await addKnowledge(content, conversationId, metadata);

      return `Successfully learn and stored in neural memory: "${content.substring(0, 50)}..."`;
    } catch (error: any) {
      return `Error storing knowledge: ${error.message}`;
    }
  },
};

// ============================================
// Export all MCP Tools
// ============================================

export const MCPTools: MCPTool[] = [
  searchKnowledgeTool,
  getUserConversationsTool,
  searchContactsTool,
  getRecentMessagesTool,
  storeKnowledgeTool,
];

/**
 * Get a tool by name
 * This is used when AI decides it needs to use a tool
 */
export function getMCPTool(toolName: string): MCPTool | undefined {
  return MCPTools.find((tool) => tool.name === toolName);
}

/**
 * Get all available tools
 * This is sent to the AI so it knows what tools exist
 */
export function getAvailableMCPTools() {
  return MCPTools.map((tool) => ({
    name: tool.name,
    description: tool.description,
  }));
}

/**
 * Execute an MCP tool
 * This is called when AI wants to use a tool
 */
export async function executeMCPTool(toolName: string, params: any): Promise<string> {
  const tool = getMCPTool(toolName);
  if (!tool) {
    return `Tool "${toolName}" not found. Available tools: ${MCPTools.map((t) => t.name).join(", ")}`;
  }
  return await tool.execute(params);
}
