# NexusChat - Phase 2: Auth & Profiles

## 1. Supabase Project Setup
1. Create a new project at [database.new](https://database.new)
2. Go to **Project Settings > API** to get your URL and Anon Key.
3. Enable **Google Auth** in **Authentication > Providers**:
   - Follow the detailed **Google OAuth Guide** below.

### 🌟 Detailed Google OAuth Guide

#### Step A: Google Cloud Console
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a **New Project**.
3. Go to **APIs & Services > OAuth consent screen**.
   - Choose **External**.
   - Fill in the app name and your email.
4. Go to **APIs & Services > Credentials**.
   - Click **+ Create Credentials** > **OAuth client ID**.
   - Application type: **Web application**.
   - Name: `NexusChat`.
   - **Authorized redirect URIs**: You will get this from Supabase in the next step.

#### Step B: Supabase Dashboard
1. In Supabase, go to **Authentication > Providers > Google**.
2. Toggle on "Enable Google Provider".
3. Copy the **Callback URL** (Redirect URI) shown at the bottom of the Google provider settings.

#### Step C: Finalize Google Credentials
1. Paste the **Callback URL** from Supabase into the **Authorized redirect URIs** in your Google Cloud Credential (from Step A.4).
2. Click **Create** in Google Cloud.
3. Copy the **Client ID** and **Client Secret** and paste them into the Supabase Google provider settings.
4. Click **Save** in Supabase.

## 2. Environment Variables
Create a `.env.local` file in your project root:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 3. Database Schema
Run the following SQL in the **Supabase SQL Editor**:
```sql
-- Create profiles table
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table profiles enable row level security;

-- Policies
create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Trigger for auto-creation
drop trigger if exists on_auth_user_created on auth.users;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id, 
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'User'), 
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

## 4. Run the App
```bash
npm install
npm run dev
```
Navigate to `http://localhost:3000`. You will be redirected to `/auth`.
