import { createClient } from "@/lib/supabase/client";

export async function getCurrentUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Try to get user profile with full name and username
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
    avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || "",
  };
}

export async function getUserName() {
  const user = await getCurrentUser();
  return user?.name || "User";
}

export async function updateProfile(data: {
  username?: string;
  full_name?: string;
  avatar_url?: string;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  // Use upsert to create the profile if it doesn't exist, or update it if it does
  const { error } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      username: data.username,
      full_name: data.full_name,
      avatar_url: data.avatar_url,
      updated_at: new Date().toISOString()
    });

  if (error) {
    throw new Error(error.message || "Failed to update profile");
  }

  return true;
}
