# 🌐 NexusChat - Google Cloud Console: A to Z Guide

This guide provides the complete, step-by-step instructions to set up **Google OAuth** for your NexusChat application. Follow these steps to allow users to "Login with Google".

---

## 🅰️ Part 1: Register your App with Google

1.  **Open Google Cloud Console**: Go to [console.cloud.google.com](https://console.cloud.google.com/).
2.  **Create a Project**: 
    *   Click on the project dropdown at the top left.
    *   Click **"New Project"**.
    *   Name it `NexusChat` and click **Create**.
    *   Wait for it to finish and then click **"Select Project"**.
3.  **Setup Consent Screen**:
    *   In the left menu, go to **APIs & Services > OAuth consent screen**.
    *   User Type: Choose **External**. Click **Create**.
    *   **App Information**: 
        *   App name: `NexusChat`
        *   User support email: (Select your email)
        *   Developer contact information: (Enter your email again)
    *   Click **Save and Continue** for all next steps (Scopes, Test users, Summary).
4.  **Create Credentials**:
    *   In the left menu, click **Credentials**.
    *   Click **+ Create Credentials** at the top and select **OAuth client ID**.
    *   Application type: **Web application**.
    *   Name: `NexusChat (Web)`.
    *   **Authorized redirect URIs**: 🚩 *STOP HERE. Keep this tab open.*

---

## 🅱️ Part 2: Get the Link from Supabase

1.  Open your [Supabase Dashboard](https://supabase.com).
2.  Go to **Authentication > Providers > Google**.
3.  Enable the Google provider.
4.  Scroll down and find the **Callback URL** (it looks like `https://xyz.supabase.co/auth/v1/callback`).
5.  **Copy this link**.

---

## 🆎 Part 3: Connecting Google & Supabase

1.  **Back to Google Cloud**: Go back to the tab from Part 1.
2.  Click **"Add URI"** under "Authorized redirect URIs".
3.  **Paste the link** you copied from Supabase.
4.  Click **Create**.
5.  A box will appear with **Your Client ID** and **Your Client Secret**. **Copy both of these.**

---

## 🏁 Final Step: Save in Supabase

1.  Go back to **Supabase > Authentication > Providers > Google**.
2.  Paste the **Client ID** into the "Client ID" box.
3.  Paste the **Client Secret** into the "Client Secret" box.
4.  Click **Save**.

---

## 🤖 Part 4: Setup Nexus AI (Gemini)

To enable the AI chatbot features, you need a Google Generative AI API Key.

1.  **Get your Key**: Go to [Google AI Studio](https://aistudio.google.com/).
2.  **Generate API Key**: Click on **"Get API key"** and then **"Create API key in new project"**.
3.  **Copy the Key**: Copy the long string of characters.
4.  **Update `.env.local`**: Add this line to your project's `.env.local` file:
    ```env
    GOOGLE_GENERATIVE_AI_API_KEY=your_copied_key_here
    ```
5.  **Restart Server**: Close your terminal (Ctrl+C) and run `npm run dev` again to load the new key.

---

## 🚀 Launching the App

1.  Ensure your `.env.local` has your Supabase URL and Anon Key.
2.  Run the app:
    ```bash
    npm run dev
    ```
3.  Visit `http://localhost:3000`. 
4.  You will be redirected to the Login page. 
5.  Click the **Google** button. It works! 🎉

---

### Need more help?
For technical details and database scripts, refer to the [AUTH_DOCUMENTATION.md](./AUTH_DOCUMENTATION.md).

