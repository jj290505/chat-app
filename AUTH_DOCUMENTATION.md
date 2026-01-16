# 🔐 Authentication & User Profiles Documentation

This document provides a comprehensive guide to the **Phase 2: Authentication** implementation for NexusChat. We use **Supabase Auth** for security, **Supabase PostgreSQL** for data, and **Next.js Middleware** for route protection.

---

## 🏗️ Architecture Overview

Our authentication system is built on **three pillars of security**:

1.  **Next.js Middleware**: Acts as a "Bouncer". It checks for a valid session cookie *before* any protected page (like `/chat`) is rendered.
2.  **Server-Side Rendering (SSR)**: The server validates the user's session and identity, preventing unauthorized access even if JavaScript is tampered with in the browser.
3.  **Row Level Security (RLS)**: The database itself restricts access. Even with a valid connection, users can only see or edit their own profile data.

---

## 🚀 Setup Guide

### 1. Supabase Initialization
1.  Create a project at [Supabase.com](https://supabase.com).
2.  In your project sidebar, go to **Project Settings > API**.
3.  Copy your `Project URL` and `Anon Key`.
4.  Create a `.env.local` file in your project root:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
    ```

### 2. Database Configuration
Go to the **SQL Editor** in Supabase and run the following script:

```sql
-- 1. Create the Profiles Table
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamp with time zone default now()
);

-- 2. Enable Security
alter table profiles enable row level security;

-- 3. Define Access Rules (Policies)
create policy "Profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can update their own profile." on profiles for update using (auth.uid() = id);

-- 4. Auto-Create Profile Trigger
-- First, drop the trigger if it already exists to avoid errors
drop trigger if exists on_auth_user_created on auth.users;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id, 
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'New User'), 
    new.email, 
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

## 🌟 Google OAuth Setup (Simplified)

Follow this **VIP Checklist** to enable "Login with Google":

### Part A: Google Cloud Console
1.  **Project**: Create a new project at [Google Cloud Console](https://console.cloud.google.com/).
2.  **Consent**: Go to **OAuth consent screen** > **External**. Fill in App Name & Email.
3.  **Credentials**: Go to **Credentials** > **+ Create Credentials** > **OAuth client ID**.
    *   Application type: **Web application**.
    *   *Leave the "Redirect URI" part open for now.*

### Part B: Supabase Link
1.  In Supabase, go to **Authentication > Providers > Google**.
2.  Toggle **Enable**.
3.  Copy the **Redirect URI** shown at the bottom (e.g., `https://xyz.supabase.co/auth/v1/callback`).

### Part C: Finish Connection
1.  Go back to Google Cloud. Paste that **Redirect URI** into the box. Click **Create**.
2.  Copy the **Client ID** and **Client Secret**.
3.  In Supabase, paste these into the Google Provider settings and click **Save**.

---

## 📂 File Structure Breakdown

| File | Purpose |
| :--- | :--- |
| `src/lib/supabase/client.ts` | Browser-side client for login/logout actions. |
| `src/lib/supabase/server.ts` | Server-side client for fetching user data in pages. |
| `src/middleware.ts` | The security bouncer that redirects unauthenticated users. |
| `src/app/auth/page.tsx` | The Login/Signup UI with Tabs. |
| `src/app/chat/page.tsx` | The protected chat interface. |
| `src/components/auth/LogoutButton.tsx` | Button to clear session and redirect. |
| `src/components/chat/UserProfileCard.tsx` | Displays current user name & avatar. |

---

## 🛠️ Verification
To test if it's working:
1.  Run `npm run dev`.
2.  Try to visit `http://localhost:3000/chat`. 
3.  If you are redirected to `/auth`, the **Bouncer (Middleware)** is working!
4.  Sign up or log in. Once redirected back to `/chat`, you should see your name in the sidebar.
