import { createClient } from "@/lib/supabase/client";

export interface StoredMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export async function saveConversation(
  title: string,
  messages: StoredMessage[]
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  // Create conversation
  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .insert({
      user_id: user.id,
      title,
    })
    .select()
    .single();

  if (convError) throw convError;

  // Insert messages
  const messagesToInsert = messages.map((msg) => ({
    conversation_id: conversation.id,
    role: msg.role,
    content: msg.content,
  }));

  const { error: msgError } = await supabase
    .from("messages")
    .insert(messagesToInsert);

  if (msgError) throw msgError;

  return conversation;
}

export async function loadConversation(conversationId: string) {
  const supabase = createClient();

  const { data: messages, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return messages as StoredMessage[];
}

export async function listConversations() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data: conversations, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  return conversations as Conversation[];
}

export async function updateConversationTitle(
  conversationId: string,
  newTitle: string
) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("conversations")
    .update({
      title: newTitle,
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function deleteConversation(conversationId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from("conversations")
    .delete()
    .eq("id", conversationId);

  if (error) throw error;
}

export async function addMessageToConversation(
  conversationId: string,
  message: StoredMessage
) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      role: message.role,
      content: message.content,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}
