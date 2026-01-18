import { createClient } from "@/lib/supabase/client";

export interface Contact {
  id: string;
  contact_user_id: string;
  contact_name: string;
  contact_email: string;
  contact_avatar_url: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count?: number;
  contact_profile?: {
    username: string;
    full_name: string;
    avatar_url: string | null;
  }
}

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  email?: string;
  updated_at?: string;
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  // 1. Pre-flight sync: Ensure all accepted requests have corresponding contact rows
  // This is now done BEFORE we fetch to ensure we have the data
  await syncAcceptedRequests();

  // 2. Fetch contacts with latest profile info joined from profiles table
  const { data: contacts, error } = await supabase
    .from("contacts")
    .select(`
      *,
      contact_profile:profiles!contact_user_id (
        username,
        full_name,
        avatar_url
      )
    `)
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  // 3. (Optional) Dynamically enrich with last message and unread count
  const enrichedContacts = await Promise.all((contacts || []).map(async (contact) => {
    // Get unread count
    const { count: unreadCount } = await supabase
      .from("direct_messages")
      .select("*", { count: 'exact', head: true })
      .eq("sender_id", contact.contact_user_id)
      .eq("receiver_id", user.id)
      .is("read_at", null);

    // ALWAYS fetch the latest message for each contact to ensure sidebar is fresh
    const { data: lastMsg } = await supabase
      .from("direct_messages")
      .select("content, created_at")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${contact.contact_user_id}),and(sender_id.eq.${contact.contact_user_id},receiver_id.eq.${user.id})`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const lastMsgData = {
      last_message: lastMsg?.content || contact.last_message || "No messages yet",
      last_message_at: lastMsg?.created_at || contact.last_message_at
    };

    return {
      ...contact,
      ...lastMsgData,
      unread_count: unreadCount || 0
    };
  }));

  return enrichedContacts as Contact[];
}

export async function markMessagesAsRead(contactUserId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("direct_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("sender_id", contactUserId)
    .eq("receiver_id", user.id)
    .is("read_at", null);
}

export async function syncAcceptedRequests() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // 1. Get all requests I sent or received that are 'accepted'
  const { data: requests } = await supabase
    .from("chat_requests")
    .select("*")
    .eq("status", "accepted")
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

  if (requests) {
    for (const req of requests) {
      const targetUserId = req.sender_id === user.id ? req.receiver_id : req.sender_id;
      await ensureContactExists(targetUserId);
    }
  }
}

export async function deleteContact(contactId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Delete from contacts table
  const { error } = await supabase
    .from("contacts")
    .delete()
    .eq("id", contactId)
    .eq("user_id", user.id);

  if (error) throw error;
  return true;
}

export async function searchProfiles(query: string) {
  const supabase = createClient();

  // Get current user to exclude from search
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error("Auth error in searchProfiles:", userError);
    return [];
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
    .neq('id', user.id) // Exclude current user
    .limit(15);

  if (error) {
    console.error("Search error:", error);
    throw error;
  }

  return data as Profile[];
}

export async function getSuggestedProfiles() {
  const supabase = createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("Auth error in getSuggestedProfiles:", userError);
    return [];
  }

  // 1. Get IDs of users I am already contacts with
  const { data: contactData } = await supabase
    .from("contacts")
    .select("contact_user_id")
    .eq("user_id", user.id);

  const existingContactIds = contactData?.map(c => c.contact_user_id) || [];

  // 2. Get IDs of users I have already requested
  const { data: requestData } = await supabase
    .from("chat_requests")
    .select("receiver_id")
    .eq("sender_id", user.id)
    .eq("status", "pending");

  const requestedIds = requestData?.map(r => r.receiver_id) || [];

  const excludeIds = [user.id, ...existingContactIds, ...requestedIds];

  // Fetch profiles not in exclude list
  // Using a more robust approach: filter out my own ID and existing contacts
  let query = supabase.from("profiles").select("*");

  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`);
  } else {
    query = query.neq('id', user.id);
  }

  const { data, error } = await query.limit(10);

  if (error) {
    console.error("Error fetching suggested profiles:", error);
    // Simple fallback
    const { data: fallback } = await supabase.from("profiles").select("*").neq('id', user.id).limit(10);
    return fallback as Profile[] || [];
  }

  return data as Profile[];
}

export async function sendChatRequest(receiverId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Use upsert to handle case where request already exists
  const { data, error } = await supabase
    .from("chat_requests")
    .upsert({
      sender_id: user.id,
      receiver_id: receiverId,
      status: 'pending',
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'sender_id,receiver_id'
    })
    .select();

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

export async function ensureContactExists(targetUserId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Check if contact already exists
  const { data: existing } = await supabase
    .from("contacts")
    .select("*")
    .eq("user_id", user.id)
    .eq("contact_user_id", targetUserId)
    .maybeSingle();

  if (!existing) {
    // Fetch profile of the target user
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", targetUserId)
      .single();

    if (profile) {
      const name = profile.full_name || profile.username || profile.email || "User";
      console.log(`[ensureContactExists] Creating contact row for ${name}`);
      await supabase.from("contacts").insert({
        user_id: user.id,
        contact_user_id: targetUserId,
        contact_name: name,
        contact_email: profile.email || "",
        contact_avatar_url: profile.avatar_url
      });
    }
  } else if (existing.contact_name === "Unknown User" || existing.contact_name === "Unknown" || !existing.contact_name) {
    // If contact exists but data is missing/corrupt, refresh it
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", targetUserId)
      .single();

    if (profile) {
      const name = profile.full_name || profile.username || profile.email || "User";
      await supabase
        .from("contacts")
        .update({
          contact_name: name,
          contact_avatar_url: profile.avatar_url
        })
        .eq("id", existing.id);
    }
  }
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

  // 2. If accepted, create contact entries for BOTH users (as much as RLS allows)
  if (status === 'accepted') {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) throw new Error("Not authenticated");

    // Receiver creating contact for sender (Always works)
    await ensureContactExists(request.sender_id);

    // Attempting to create contact for sender (receiver adding User B for User A)
    // This might fail due to RLS, but that's okay because the sender's client
    // will now also call ensureContactExists when it sees the status change to 'accepted'.
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

export async function getDirectMessages(contactUserId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data: messages, error } = await supabase
    .from("direct_messages")
    .select("*")
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${contactUserId}),and(sender_id.eq.${contactUserId},receiver_id.eq.${user.id})`
    )
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error loading messages:", error);
    throw error;
  }

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

  // 1. Broadcast to the specific chat channel (for the active chat window)
  const [id1, id2] = [user.id, receiverId].sort();
  const chatChannelName = `messages:${id1}-${id2}`;
  supabase.channel(chatChannelName).send({
    type: 'broadcast',
    event: 'new_message',
    payload: data
  });

  // 2. Broadcast to SENDER's notification channel (to update their own sidebar)
  supabase.channel(`notifications:${user.id}`).send({
    type: 'broadcast',
    event: 'sidebar_update',
    payload: data
  });

  // 3. Broadcast to RECEIVER's notification channel (to update their sidebar/badge)
  supabase.channel(`notifications:${receiverId}`).send({
    type: 'broadcast',
    event: 'sidebar_update',
    payload: data
  });

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
  contactUserId: string,
  onNewMessage: (message: DirectMessage) => void
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Determinate channel name for the conversation
  const [id1, id2] = [user.id, contactUserId].sort();
  const channelName = `messages:${id1}-${id2}`;

  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "direct_messages",
      },
      (payload) => {
        const msg = payload.new as DirectMessage;
        // Verify this message is actually for this chat (extra safety)
        const isParticipant =
          (msg.sender_id === user.id && msg.receiver_id === contactUserId) ||
          (msg.sender_id === contactUserId && msg.receiver_id === user.id);

        if (isParticipant) {
          onNewMessage(msg);
        }
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "direct_messages",
      },
      (payload) => {
        const msg = payload.new as DirectMessage;
        const isParticipant =
          (msg.sender_id === user.id && msg.receiver_id === contactUserId) ||
          (msg.sender_id === contactUserId && msg.receiver_id === user.id);

        if (isParticipant) {
          onNewMessage(msg);
        }
      }
    )
    .on(
      "broadcast",
      { event: "new_message" },
      (payload) => {
        onNewMessage(payload.payload as DirectMessage);
      }
    )
    .subscribe();

  return channel;
}

export async function subscribeToChatRequests(
  onNewRequest: (request: ChatRequest) => void,
  onStatusChange: (request: ChatRequest) => void
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const subscription = supabase
    .channel(`chat_requests:${user.id}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "chat_requests",
        filter: `receiver_id=eq.${user.id}`,
      },
      (payload) => {
        onNewRequest(payload.new as ChatRequest);
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "chat_requests",
        // No filter here to catch both sender and receiver updates
      },
      (payload) => {
        const request = payload.new as ChatRequest;
        // Check if current user is either sender or receiver
        if (request.sender_id === user.id || request.receiver_id === user.id) {
          onStatusChange(request);
        }
      }
    )
    .subscribe();

  return subscription;
}

export async function subscribeToContacts(
  onContactsChange: (data: any) => void
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const subscription = supabase
    .channel(`contacts:${user.id}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "contacts",
        filter: `user_id=eq.${user.id}`,
      },
      (payload) => {
        onContactsChange(payload);
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "profiles",
      },
      (payload) => {
        onContactsChange(payload);
      }
    )
    .subscribe();

  return subscription;
}
