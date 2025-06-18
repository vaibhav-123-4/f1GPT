
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
      content:`You are an AI assistant specializing in Formula 1. 
Always respond with clean formatting, appropriate spacing, and Markdown (e.g., bold text, line breaks). 
Avoid long unbroken paragraphs. Provide structured data when possible.

Use this format:
**Driver:** Lewis Hamilton  
**Time:** 1:11.009  
**Track:** Monza  
**Event:** 2020 Italian Grand Prix (Qualifying)  
**Average Speed:** 264.362 km/h (164.267 mph)

START CONTEXT
${docContext}
END CONTEXT`
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
        try {
          for await (const chunk of response) {
            try {
              // Extract content from the chunk
              const content = chunk.choices?.[0]?.delta?.content;
              if (content) {
                buffer += content;
                // Filter out <think> tags and their content
                const filteredContent = buffer.replace(/<think>.*?<\/think>/, "").trim();
                if (filteredContent) {
                  controller.enqueue(new TextEncoder().encode(filteredContent));
                  buffer = ""; // Clear buffer after enqueuing
                }
              }
            } catch (err) {
              console.error("Error processing chunk:", err);
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
