import { NextRequest, NextResponse } from "next/server";
import Together from "together-ai";
import { DataAPIClient } from "@datastax/astra-db-ts";

const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
  TOGETHERAI_API_KEY
} = process.env;

const together = new Together({ apiKey: TOGETHERAI_API_KEY });
const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN!);
const db = client.db(ASTRA_DB_API_ENDPOINT!, { namespace: ASTRA_DB_NAMESPACE! });

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const latestMessage = messages?.[messages.length - 1]?.content || "";

    // Fetch context from Astra DB
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

    const systemPrompt = {
      role: "system" as const,
     content: `
You are **F1GPT**, an expert AI assistant in all things Formula 1.

✅ **Formatting Guidelines:**  
- Always use **Markdown** for styling: bold text, line breaks, bullet points when needed.  
- Maintain **clear spacing** and avoid large unbroken paragraphs.  
- When presenting performance data, use the following structured format:

**Driver:** Lewis Hamilton  
**Time:** 1:11.009  
**Track:** Monza  
**Event:** 2020 Italian Grand Prix (Qualifying)  
**Average Speed:** 264.362 km/h (164.267 mph)

🎯 **Response Style:**  
- Be precise, informative, and concise.  
- Use a factual tone suitable for motorsport analysis.  
- Where applicable, include relevant statistics, historical context, or comparisons.

📄 **Context Handling:**  
Use the following information as background for generating responses.

START CONTEXT  
${docContext}  
END CONTEXT
`
};


    const response = await together.chat.completions.create({
      model: "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8",
      messages: [systemPrompt, { role: "user", content: latestMessage }],
      stream: true,
    });

    // Create a ReadableStream to handle the async iterator
    const stream = new ReadableStream({
      async start(controller) {
        let buffer = "";
        const encoder = new TextEncoder();
        try {
          for await (const chunk of response) {
            const content = chunk.choices?.[0]?.delta?.content || "";
            buffer += content;

            // Replace all complete <think>...</think> tags
            buffer = buffer.replace(/<think>.*?<\/think>/gs, "");

            // Check if there's an incomplete <think> tag at the end
            const lastThinkTagStart = buffer.lastIndexOf('<think>');
            const lastThinkTagEnd = buffer.lastIndexOf('</think>');

            let sendableContent = buffer;
            if (lastThinkTagStart > lastThinkTagEnd) {
              // Incomplete tag at the end, don't send it yet
              sendableContent = buffer.substring(0, lastThinkTagStart);
              buffer = buffer.substring(lastThinkTagStart);
            } else {
              // No incomplete tag, we can send everything
              buffer = "";
            }

            if (sendableContent) {
              controller.enqueue(encoder.encode(sendableContent));
            }
          }

          // After loop, send any remaining part of the buffer
          if (buffer) {
            // Final cleanup
            buffer = buffer.replace(/<think>.*?<\/think>/gs, "");
            if (buffer) {
                controller.enqueue(encoder.encode(buffer));
            }
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
