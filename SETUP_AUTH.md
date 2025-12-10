# F1GPT Authentication Setup Guide

## Prerequisites
You need to set up a Supabase project for authentication and chat history storage.

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in project details:
   - Name: `f1gpt` (or any name)
   - Database Password: (save this securely)
   - Region: Choose closest to your users
4. Wait for project to be created (~2 minutes)

## Step 2: Get Supabase Credentials

1. In your Supabase dashboard, go to **Project Settings** (gear icon)
2. Navigate to **API** section
3. Copy these values to your `.env.local`:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Step 3: Set Up Google OAuth

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Find **Google** and click to expand
3. Enable Google provider
4. Go to [Google Cloud Console](https://console.cloud.google.com)
5. Create new project or select existing
6. Enable **Google+ API**
7. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
8. Configure OAuth consent screen if needed
9. Application type: **Web application**
10. Add authorized redirect URIs:
    ```
    https://your-project-ref.supabase.co/auth/v1/callback
    ```
    (Replace `your-project-ref` with your actual Supabase project reference)
11. Copy **Client ID** and **Client Secret**
12. Paste them in Supabase Google provider settings
13. Click **Save**

## Step 4: Create Database Tables

Run these SQL commands in Supabase SQL Editor:

### Conversations Table
\`\`\`sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own conversations
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own conversations
CREATE POLICY "Users can insert own conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own conversations
CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own conversations
CREATE POLICY "Users can delete own conversations"
  ON conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);
\`\`\`

### Messages Table
\`\`\`sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view messages from their conversations
CREATE POLICY "Users can view messages from own conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- Policy: Users can insert messages to their conversations
CREATE POLICY "Users can insert messages to own conversations"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- Create indexes for faster queries
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
\`\`\`

## Step 5: Update Environment Variables

Create `.env.local` in your project root:

\`\`\`env
# Astra DB (existing)
ASTRA_DB_NAMESPACE=your_namespace
ASTRA_DB_COLLECTION=your_collection
ASTRA_DB_API_ENDPOINT=your_astra_endpoint
ASTRA_DB_APPLICATION_TOKEN=your_astra_token

# Together AI (existing)
TOGETHERAI_API_KEY=your_together_api_key

# Chat API Security (existing)
CHATBOT_SECRET_KEY=your_secret_key

# Supabase (NEW)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
\`\`\`

## Step 6: Run the Application

\`\`\`bash
npm run dev
\`\`\`

## Testing

1. Navigate to `http://localhost:3000`
2. Click "Sign in with Google"
3. Authorize with your Google account
4. Start chatting - your conversations will be saved!
5. Reload the page - your chat history persists in the sidebar

## Features Now Available

✅ Google OAuth authentication  
✅ User profile display  
✅ Chat history saved per user  
✅ Conversation sidebar  
✅ Protected chat API  
✅ Automatic session management  

## Troubleshooting

**"Invalid redirect URI"**: Make sure you added the correct callback URL in Google Cloud Console

**"User not found"**: Check your Supabase RLS policies are correctly set up

**Chat history not loading**: Verify the database tables were created and RLS policies are active

**Authentication loop**: Clear cookies and try again, check environment variables are correct
