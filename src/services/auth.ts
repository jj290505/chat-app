import { createClient } from "@/lib/supabase/client";

export async function signInGuest() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInAnonymously({
    options: {
      data: {
        full_name: "Guest User",
      }
    }
  });

  if (error) {
    console.error("Guest login failed:", error);
    // Fallback: manually sign in with a dedicated guest account if needed, 
    // but signInAnonymously is preferred.
    throw error;
  }

  return data.user;
}

export async function signInWithGoogle() {
  const supabase = createClient();
  const origin = window.location.origin;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) throw error;
}

export async function logout() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  window.location.reload();
}

export async function getCurrentUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Try to get user profile with full name
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, username, avatar_url")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email || "",
    name: profile?.full_name || user.user_metadata?.full_name || "User",
    username: profile?.username || "",
    avatar_url: profile?.avatar_url || null,
  };
}

export async function updateProfile(updates: { username?: string; full_name?: string; avatar_url?: string }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserName() {
  const user = await getCurrentUser();
  return user?.name || "User";
}
