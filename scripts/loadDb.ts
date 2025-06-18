import openAI from 'openai';
import { DataAPIClient } from '@datastax/astra-db-ts';
import { PuppeteerWebBaseLoader } from "langchain/document_loaders/web/puppeteer";
import "dotenv/config";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import Together from "together-ai";

type similarityMetric = "cosine" | "dot_product" | "euclidean";

const { ASTRA_DB_NAMESPACE, ASTRA_DB_COLLECTION, ASTRA_DB_API_ENDPOINT, ASTRA_DB_APPLICATION_TOKEN, TOGETHERAI_API_KEY } = process.env;

const together = new Together({
  apiKey: TOGETHERAI_API_KEY,
});

const f1Data = [
  "https://en.wikipedia.org/wiki/Formula_One",
  "https://www.formula1.com/en/latest/all",
  "https://www.formula1.com/en/racing/2023.html",
  "https://www.formula1.com/en/racing/2022.html",
  "https://www.formula1.com/en/racing/2021.html",
  "https://www.formula1.com/en/racing/2020.html",
  "https://www.formula1.com/en/racing/2019.html",
  "https://www.formula1.com/en/racing/2018.html",
  "https://www.formula1.com/en/racing/2017.html",
  "https://www.formula1.com/",
  "https://www.formula1.com/en/timing/f1-live",
  "https://pitwall.app/",
  "https://www.formula1.com/en/racing/2024.html",
  "https://www.formula1.com/en/racing/2025.html",
  "https://www.formula1.com/en/racing/2026.html",
  "https://www.sportingnews.com/in/formula-1/news/how-much-f1-drivers-paid-salaries-teams-2025/0b1bf1b718b47a324caa7364",
  "https://en.wikipedia.org/wiki/Lewis_Hamilton",
  "https://en.wikipedia.org/wiki/Max_Verstappen",
  "https://en.wikipedia.org/wiki/Charles_Leclerc",
];

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE });

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 512,
  chunkOverlap: 100,
});

const createCollection = async (similarityMetric: similarityMetric = "dot_product") => {
  try {
    await db.createCollection(ASTRA_DB_COLLECTION, {
      vector: {
        dimension: 768,
        metric: similarityMetric,
      },
    });
    console.log("✅ Collection created");
  } catch (err: any) {
    if (err.name === 'CollectionAlreadyExistsError') {
      console.log("⚠️ Collection already exists, skipping creation.");
    } else {
      throw err;
    }
  }
};

const loadSampleData = async () => {
  const collection = db.collection(ASTRA_DB_COLLECTION);

  for await (const url of f1Data) {
    try {
      const content = await scrapePage(url);
      const chunks = await splitter.splitText(content);

      for await (const chunk of chunks) {
        try {
          const existing = await collection.findOne({ text: chunk });
          if (existing) {
            console.log("🔁 Duplicate chunk found, skipping...");
            continue;
          }

          const embedding = await together.embeddings.create({
            model: 'togethercomputer/m2-bert-80M-32k-retrieval',
            input: chunk,
          });

          const vector = embedding.data[0].embedding;

          const res = await collection.insertOne({
            $vector: vector,
            text: chunk,
          });

          console.log("✅ Inserted:", res.insertedId);
        } catch (err) {
          console.error("❌ Error inserting chunk:", err);
        }
      }
    } catch (err) {
      console.error(`❌ Error scraping or inserting from URL: ${url}`, err);
    }
  }
};

const scrapePage = async (url: string): Promise<string> => {
  const loader = new PuppeteerWebBaseLoader(url, {
    launchOptions: {
      headless: "new",
    },
    gotoOptions: {
      waitUntil: "domcontentloaded",
    },
    evaluate: async (page, browser) => {
      const content = await page.evaluate(() => document.body.innerHTML);
      await browser.close();
      return content;
    },
  });

  const html = await loader.scrape();
  return html ? html.replace(/<[^>]*>/g, '') : '';
};

const main = async () => {
  await createCollection();
  await loadSampleData();
};

main();
