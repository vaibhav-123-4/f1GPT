
"use client";
import Image from "next/image";
import f1GPT from "./assets/f1GPT.png";
import { useState } from "react";
import Bubble from "./components/Bubbles";
import PromptSuggestionRow from "./components/PromptSuggestionRow";
import LoadingBubble from "./components/LoadingBubble";

const Home = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [streaming, setStreaming] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch response");
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder("utf-8");
      let assistantMessage = "";
      setMessages([...newMessages, { role: "assistant", content: "" }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        assistantMessage += chunk;

        // Update the assistant message incrementally
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: assistantMessage,
          };
          return updated;
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

  const onPromptClick = (promptText: string) => setInput(promptText);

  return (
    <main>
      <Image src={f1GPT} width={250} alt="F1GPT" />
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
    </main>
  );
};

export default Home;
