# 🔧 Supabase Configuration for F1GPT

## Important: Disable Email Confirmation for Testing

For development/testing, you should disable email confirmation in Supabase to make the signup process instant.

### Steps to Configure Supabase:

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard

2. **Navigate to Authentication Settings**:
   - Click on your project: `cpgwgjuyesrsardgynah`
   - Go to `Authentication` → `Providers` → `Email`

3. **Disable Email Confirmation** (for testing):
   - Scroll to "Confirm email"
   - **Toggle OFF** "Enable email confirmations"
   - Click "Save"

4. **Configure Google OAuth** (optional but recommended):
   - Go to `Authentication` → `Providers`
   - Find `Google` and click to expand
   - Enable the provider
   - Add your Google OAuth credentials (see SETUP_AUTH.md)

5. **Set Up Database Tables** (IMPORTANT!):
   Go to `SQL Editor` and run these commands:

### Conversations Table
\`\`\`sql
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can insert own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON conversations;

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);
\`\`\`

### Messages Table
\`\`\`sql
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view messages from own conversations" ON messages;
DROP POLICY IF EXISTS "Users can insert messages to own conversations" ON messages;

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
\`\`\`

## Testing the Authentication Flow

### Test Signup:
1. Go to `http://localhost:3000`
2. Click "Get Started"
3. Choose "Email & Password"
4. Fill in the form:
   - Full Name: Your Name
   - Email: test@example.com
   - Password: test123456
   - Confirm Password: test123456
5. Click "Sign Up"
6. You should see success message and be redirected to sign in
7. Sign in with the same credentials
8. You should be redirected to the chat interface

### Debugging Tips:

**Check Browser Console**: 
- Open DevTools (F12)
- Look for console.log messages:
  - 🚀 Attempting signup
  - 📝 Signup response
  - ✅ User created
  - 📧 Email confirmation (if enabled)

**Common Issues:**

1. **"Failed to sign up"**: 
   - Check browser console for error details
   - Verify Supabase URL and keys in `.env`
   - Check Supabase dashboard for error logs

2. **"Email already registered"**:
   - Use a different email or delete the user in Supabase dashboard
   - Go to `Authentication` → `Users` → Find user → Delete

3. **Database errors**:
   - Make sure you ran the SQL commands to create tables
   - Check Row Level Security policies are enabled

4. **Session not created**:
   - If email confirmation is ON, check your email
   - If email confirmation is OFF, check browser console for errors

## Production Setup

For production, you should:
1. **Enable email confirmation**
2. Configure email templates in Supabase
3. Set up custom SMTP (optional)
4. Add rate limiting
5. Configure proper redirect URLs for your domain

## Quick Verification

Run this in Supabase SQL Editor to check if tables exist:
\`\`\`sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('conversations', 'messages');
\`\`\`

Should return both table names if setup is correct!
