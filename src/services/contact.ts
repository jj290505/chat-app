import { createClient } from "@/lib/supabase/client";

export interface Contact {
  id: string;
  contact_user_id: string;
  contact_name: string;
  contact_email: string;
  contact_avatar_url: string | null;
  last_message: string | null;
  last_message_at: string | null;
}

export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface ChatRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  sender_profile?: Profile;
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  media_url?: string | null;
  media_type?: string | null;
  created_at: string;
  read_at: string | null;
}

export async function getContacts() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data: contacts, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return contacts as Contact[];
}

export async function searchProfiles(query: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
    .limit(10);

  if (error) throw error;
  return data as Profile[];
}

export async function sendChatRequest(receiverId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("chat_requests")
    .insert({
      sender_id: user.id,
      receiver_id: receiverId,
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getPendingRequests() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: requests, error } = await supabase
    .from("chat_requests")
    .select("*")
    .eq("receiver_id", user.id)
    .eq("status", "pending");

  if (error) throw error;

  if (requests && requests.length > 0) {
    const senderIds = requests.map(r => r.sender_id);
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .in("id", senderIds);

    if (profileError) throw profileError;

    return requests.map(r => ({
      ...r,
      sender_profile: profiles?.find(p => p.id === r.sender_id)
    })) as ChatRequest[];
  }

  return [] as ChatRequest[];
}

export async function respondToRequest(requestId: string, status: 'accepted' | 'rejected') {
  const supabase = createClient();

  // 1. Update request status
  const { data: request, error: updateError } = await supabase
    .from("chat_requests")
    .update({ status })
    .eq("id", requestId)
    .select()
    .single();

  if (updateError) throw updateError;

  // 2. If accepted, create contact entries for BOTH users
  if (status === 'accepted') {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) throw new Error("Not authenticated");

    // Get profiles for both
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", [request.sender_id, request.receiver_id]);

    const senderProfile = profiles?.find(p => p.id === request.sender_id);
    const receiverProfile = profiles?.find(p => p.id === request.receiver_id);

    // Create contact for receiver (User B adding User A)
    await supabase.from("contacts").insert({
      user_id: currentUser.id,
      contact_user_id: request.sender_id,
      contact_name: senderProfile?.full_name || senderProfile?.username || "Unknown",
      contact_avatar_url: senderProfile?.avatar_url
    });

    // Create contact for sender (User A adding User B)
    await supabase.from("contacts").insert({
      user_id: request.sender_id,
      contact_user_id: currentUser.id,
      contact_name: receiverProfile?.full_name || receiverProfile?.username || "Unknown",
      contact_avatar_url: receiverProfile?.avatar_url
    });
  }

  return request;
}

export async function addContact(
  contactUserEmail: string,
  contactName: string
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("contacts")
    .insert({
      user_id: user.id,
      contact_user_id: crypto.randomUUID(),
      contact_name: contactName,
      contact_email: contactUserEmail,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getDirectMessages(contactId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data: contact, error: contactError } = await supabase
    .from("contacts")
    .select("contact_user_id")
    .eq("id", contactId)
    .single();

  if (contactError) throw contactError;

  const { data: messages, error } = await supabase
    .from("direct_messages")
    .select("*")
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${contact.contact_user_id}),and(sender_id.eq.${contact.contact_user_id},receiver_id.eq.${user.id})`
    )
    .order("created_at", { ascending: true });

  if (error) throw error;
  return messages as DirectMessage[];
}

export async function sendDirectMessage(
  receiverId: string,
  content: string,
  mediaUrl?: string | null,
  mediaType?: string | null
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("direct_messages")
    .insert({
      sender_id: user.id,
      receiver_id: receiverId,
      content,
      media_url: mediaUrl,
      media_type: mediaType,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function clearMessages(receiverId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { error } = await supabase
    .from("direct_messages")
    .delete()
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`
    );

  if (error) throw error;
}

export async function uploadFile(file: File) {
  const supabase = createClient();
  const fileExt = file.name.split(".").pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `public/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("chat-media")
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("chat-media").getPublicUrl(filePath);

  return data.publicUrl;
}

export async function subscribeToMessages(
  contactId: string,
  onNewMessage: (message: DirectMessage) => void
) {
  const supabase = createClient();

  const subscription = supabase
    .channel(`direct_messages:${contactId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "direct_messages",
      },
      (payload) => {
        onNewMessage(payload.new as DirectMessage);
      }
    )
    .subscribe();

  return subscription;
}

