import { NextRequest, NextResponse } from "next/server";
import Together from "together-ai";
import { DataAPIClient } from "@datastax/astra-db-ts";

const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
  TOGETHERAI_API_KEY,
  CHATBOT_SECRET_KEY, // ✅ Secret key from environment
} = process.env;

const together = new Together({ apiKey: TOGETHERAI_API_KEY });
const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN!);
const db = client.db(ASTRA_DB_API_ENDPOINT!, { namespace: ASTRA_DB_NAMESPACE! });

export async function POST(req: NextRequest) {
  // ✅ Step 1: Authorization header check
  const authHeader = req.headers.get("authorization");
  if (!authHeader || authHeader !== `Bearer ${CHATBOT_SECRET_KEY}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { messages } = await req.json();
    const latestMessage = messages?.[messages.length - 1]?.content || "";

    // ✅ Step 2: Fetch context from Astra DB
    let docContext = "";
    try {
      const embedding = await together.embeddings.create({
        model: "togethercomputer/m2-bert-80M-32k-retrieval",
        input: latestMessage,
      });

      const collection = await db.collection(ASTRA_DB_COLLECTION!);
      const results = await collection.find(null, {
        sort: {
          $vector: embedding.data[0].embedding,
        },
        limit: 10,
      });

      const documents = await results.toArray();
      const docsMap = documents.map((doc) => doc.text || "");
      docContext = docsMap.join("\n\n").slice(0, 8000);
    } catch (err) {
      console.error("Error querying database:", err);
      docContext = "No relevant documents found.";
    }

    // ✅ Step 3: System Prompt
    const systemPrompt = {
      role: "system" as const,
      content: `
You are **F1GPT**, an AI assistant specializing exclusively in Formula 1.

🛑 **Important Rules:**  
- You must **refuse to answer** any question that is **not related to Formula 1**.  
- If a question is outside the Formula 1 domain (e.g., general science, history, tech), politely respond with:  
  **"I'm designed to answer only Formula 1–related questions. Please ask something about F1."**

✅ **Formatting Guidelines:**  
- Use **Markdown**: bold text, line breaks, and bullet points when needed.  
- Keep spacing clean and avoid long unbroken paragraphs.

📊 **Performance Data Format:**  
Use this template when sharing race data:

**Driver:** Lewis Hamilton  
**Time:** 1:11.009  
**Track:** Monza  
**Event:** 2020 Italian Grand Prix (Qualifying)  
**Average Speed:** 264.362 km/h (164.267 mph)

🎯 **Response Style:**  
- Be factual, clear, and concise.  
- Use racing terminology when applicable.  
- Provide historical context or comparisons when useful.

📄 **Context Handling:**  
Use the following information as background for generating responses.

START CONTEXT  
${docContext}  
END CONTEXT
`,
    };

    // ✅ Step 4: Create Together AI response stream
    const response = await together.chat.completions.create({
      model: "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8",
      messages: [systemPrompt, { role: "user", content: latestMessage }],
      stream: true,
    });

    // ✅ Step 5: Stream the response
    const stream = new ReadableStream({
      async start(controller) {
        let buffer = "";
        const encoder = new TextEncoder();
        try {
          for await (const chunk of response) {
            const content = chunk.choices?.[0]?.delta?.content || "";
            buffer += content;

            // Remove complete <think>...</think> tags
            buffer = buffer.replace(/<think>.*?<\/think>/gs, "");

            // Handle partial <think> tag
            const lastThinkStart = buffer.lastIndexOf("<think>");
            const lastThinkEnd = buffer.lastIndexOf("</think>");

            let sendable = buffer;
            if (lastThinkStart > lastThinkEnd) {
              sendable = buffer.substring(0, lastThinkStart);
              buffer = buffer.substring(lastThinkStart);
            } else {
              buffer = "";
            }

            if (sendable) controller.enqueue(encoder.encode(sendable));
          }

          // Send any leftover content
          if (buffer) {
            buffer = buffer.replace(/<think>.*?<\/think>/gs, "");
            if (buffer) controller.enqueue(encoder.encode(buffer));
          }

          controller.close();
        } catch (err) {
          console.error("Stream error:", err);
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Error in /api/chat:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
