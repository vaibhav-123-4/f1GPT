'use client';

import { useState, useEffect } from 'react';

interface ChatMessage {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

interface ChatHistoryProps {
  userId: string;
  onSelectChat: (messages: { role: string; content: string }[]) => void;
}

export default function ChatHistory({ userId, onSelectChat }: ChatHistoryProps) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChatHistory();
  }, [userId]);

  const loadChatHistory = async () => {
    try {
      const response = await fetch(`/api/chat-history?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    onSelectChat([]);
  };

  if (loading) {
    return <div className="chat-history-loading">Loading history...</div>;
  }

  return (
    <div className="chat-history-sidebar">
      <button onClick={handleNewChat} className="new-chat-button">
        + New Chat
      </button>
      <div className="conversation-list">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className="conversation-item"
            onClick={() => onSelectChat(conv.messages)}
          >
            <div className="conversation-preview">
              {conv.title || 'Untitled Chat'}
            </div>
            <div className="conversation-date">
              {new Date(conv.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
