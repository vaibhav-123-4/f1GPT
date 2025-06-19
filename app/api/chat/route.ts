import { NextRequest, NextResponse } from "next/server";
import Together from "together-ai";
import { DataAPIClient } from "@datastax/astra-db-ts";

const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
  TOGETHERAI_API_KEY,
  CHATBOT_SECRET_KEY,
} = process.env;

const together = new Together({ apiKey: TOGETHERAI_API_KEY });
const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN!);
const db = client.db(ASTRA_DB_API_ENDPOINT!, { namespace: ASTRA_DB_NAMESPACE! });

export async function POST(req: NextRequest) {
  // ✅ Security Check: Only allow requests with the correct secret token
  const authHeader = req.headers.get("authorization");
  if (!authHeader || authHeader !== `Bearer ${CHATBOT_SECRET_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { messages } = await req.json();
    const latestMessage = messages?.at(-1)?.content || "";

    // ✅ Retrieve relevant context from Astra DB
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

      const docs = await results.toArray();
      docContext = docs.map(doc => doc.text || "").join("\n\n").slice(0, 8000);
    } catch (err) {
      console.error("❌ DB context error:", err);
      docContext = "No relevant documents found.";
    }

    // ✅ Define System Prompt (strict to F1 domain)
    const systemPrompt = {
      role: "system" as const,
      content: `
You are **F1GPT**, an AI assistant specializing exclusively in Formula 1.

🛑 **Important Rules:**  
- You must **refuse to answer** any question that is **not related to Formula 1**.  
- If a question is outside the Formula 1 domain (e.g., general science, tech, history), reply with:  
  **"I'm designed to answer only Formula 1–related questions. Please ask something about F1."**

✅ **Formatting Guidelines:**  
- Use **Markdown**: bold text, line breaks, and bullet points when needed.  
- Avoid large unbroken paragraphs.

📊 **Performance Format:**  
**Driver:** Lewis Hamilton  
**Time:** 1:11.009  
**Track:** Monza  
**Event:** 2020 Italian Grand Prix (Qualifying)  
**Average Speed:** 264.362 km/h (164.267 mph)

📄 **Context:**  
Use this as background info.

START CONTEXT  
${docContext}  
END CONTEXT
      `,
    };

    // ✅ Call Together AI and stream response
    const response = await together.chat.completions.create({
      model: "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8",
      messages: [systemPrompt, { role: "user", content: latestMessage }],
      stream: true,
    });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let buffer = "";

        try {
          for await (const chunk of response) {
            const content = chunk.choices?.[0]?.delta?.content || "";
            buffer += content;

            // Strip <think> tags
            buffer = buffer.replace(/<think>.*?<\/think>/gs, "");

            // Handle partial <think> tag cases
            const lastStart = buffer.lastIndexOf("<think>");
            const lastEnd = buffer.lastIndexOf("</think>");
            let output = buffer;

            if (lastStart > lastEnd) {
              output = buffer.slice(0, lastStart);
              buffer = buffer.slice(lastStart);
            } else {
              buffer = "";
            }

            if (output) controller.enqueue(encoder.encode(output));
          }

          // Final flush
          buffer = buffer.replace(/<think>.*?<\/think>/gs, "");
          if (buffer) controller.enqueue(encoder.encode(buffer));

          controller.close();
        } catch (err) {
          console.error("❌ Stream error:", err);
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
    console.error("❌ Internal error in /api/chat:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
