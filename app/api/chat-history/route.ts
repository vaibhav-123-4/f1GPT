import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  try {
    // Verify the user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's chat conversations
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // For each conversation, get its messages
    const conversationsWithMessages = await Promise.all(
      (data || []).map(async (conv) => {
        const { data: messages } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: true });

        return {
          ...conv,
          messages: messages || [],
        };
      })
    );

    return NextResponse.json(conversationsWithMessages);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const { userId, conversationId, messages } = await request.json();

    // Verify the user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let convId = conversationId;

    // Create new conversation if needed
    if (!convId) {
      const firstUserMessage = messages.find((m: any) => m.role === 'user')?.content || 'New Chat';
      const title = firstUserMessage.slice(0, 50);

      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          title,
        })
        .select()
        .single();

      if (convError) throw convError;
      convId = newConv.id;
    }

    // Save messages
    const messagesToInsert = messages.map((msg: any) => ({
      conversation_id: convId,
      role: msg.role,
      content: msg.content,
    }));

    const { error: msgError } = await supabase
      .from('messages')
      .insert(messagesToInsert);

    if (msgError) throw msgError;

    return NextResponse.json({ conversationId: convId });
  } catch (error) {
    console.error('Error saving chat history:', error);
    return NextResponse.json({ error: 'Failed to save chat history' }, { status: 500 });
  }
}
