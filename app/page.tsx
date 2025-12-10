"use client";
import Image from "next/image";
import f1GPT from "./assets/f1GPT.png";
import { useState, useEffect } from "react";
import Bubble from "./components/Bubbles";
import PromptSuggestionRow from "./components/PromptSuggestionRow";
import LoadingBubble from "./components/LoadingBubble";
import LandingPage from "./components/LandingPage";
import UserProfile from "./components/UserProfile";
import ChatHistory from "./components/ChatHistory";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

const Home = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    // Check current auth status
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!input.trim()) return;

  const newMessages = [...messages, { role: "user", content: input }];
  setMessages(newMessages);
  setInput("");
  setStreaming(true);

  try {
    const res = await fetch("/api/proxy-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: newMessages }),
    });

    if (!res.ok) {
      throw new Error("Failed to fetch response");
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder("utf-8");
    let assistantMessage = "";
    setMessages([...newMessages, { role: "assistant", content: "" }]);

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      assistantMessage += chunk;

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: assistantMessage,
        };
        return updated;
      });
    }

    // Save chat history if user is logged in
    if (user) {
      const finalMessages = [...newMessages, { role: "assistant", content: assistantMessage }];
      await fetch("/api/chat-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          conversationId,
          messages: finalMessages,
        }),
      }).then(res => res.json()).then(data => {
        if (data.conversationId && !conversationId) {
          setConversationId(data.conversationId);
        }
      });
    }
  } catch (err) {
    console.error("Chat error:", err);
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "An error occurred." },
    ]);
  } finally {
    setStreaming(false);
  }
};

  const handleSelectChat = (chatMessages: { role: string; content: string }[]) => {
    setMessages(chatMessages);
    setConversationId(null); // Start new conversation
  };


  const onPromptClick = (promptText: string) => setInput(promptText);

  if (loading) {
    return (
      <main>
        <div className="logo-container">
          <Image src={f1GPT} width={250} alt="F1GPT" />
          <p className="subtitle">Loading...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <main className="authenticated-layout">
      {user && <ChatHistory userId={user.id} onSelectChat={handleSelectChat} />}
      <div className="chat-container">
        <div className="header">
          <div className="logo-container">
            <Image src={f1GPT} width={200} alt="F1GPT" />
          </div>
          {user && <UserProfile user={user} />}
        </div>
        <section className={messages.length === 0 ? "" : "populated"}>
          {messages.length === 0 ? (
            <>
              <p className="starter-text">How can I assist you today?</p>
              <br />
              <PromptSuggestionRow onPromptClick={onPromptClick} />
            </>
          ) : (
            <>
              {messages.map((message, index) => (
                <Bubble key={index} message={message} />
              ))}
              {streaming && <LoadingBubble />}
            </>
          )}
          <form onSubmit={handleSubmit}>
            <input
              className="question-box"
              onChange={(e) => setInput(e.target.value)}
              value={input}
              placeholder="Type your message here..."
              disabled={streaming}
            />
            <input type="submit" disabled={streaming} />
          </form>
        </section>
      </div>
    </main>
  );
};

export default Home;
