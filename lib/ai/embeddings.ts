/**
 * OpenAI embedding + vision helpers for visual search.
 *
 * Strategy:
 *  - Product indexing: embed "{brand} {title} {category}" via text-embedding-3-small
 *  - Image search: describe image via gpt-4o-mini vision, then embed the description
 *  - Match: cosine similarity on 1536-dim vectors via pgvector
 *
 * Model: text-embedding-3-small (1536 dimensions, $0.02/1M tokens)
 */

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIM = 1536;
const VISION_MODEL = "gpt-4o-mini";

function getApiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not configured");
  return key;
}

/**
 * Generate a text embedding vector.
 */
export async function generateTextEmbedding(text: string): Promise<number[]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI embeddings error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.data[0].embedding as number[];
}

/**
 * Generate an embedding for a product (text-based).
 * Combines brand, title, and category for rich semantic matching.
 */
export async function generateProductEmbedding(
  brand: string,
  title: string,
  category: string,
): Promise<number[]> {
  const text = `${brand} ${title} - ${category}`;
  return generateTextEmbedding(text);
}

/**
 * Describe an image using OpenAI Vision, then embed the description.
 * Returns a 1536-dim vector comparable to product embeddings.
 */
export async function generateImageEmbedding(
  imageBase64: string,
  mimeType: string = "image/jpeg",
): Promise<{ embedding: number[]; description: string }> {
  // Step 1: Describe the image via vision model
  const visionRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: VISION_MODEL,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Describe this product image for a price comparison search engine. Include the brand name, product type, color, and key features. Be concise (1-2 sentences).",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
                detail: "low",
              },
            },
          ],
        },
      ],
      max_tokens: 150,
    }),
  });

  if (!visionRes.ok) {
    const err = await visionRes.text();
    throw new Error(`OpenAI vision error (${visionRes.status}): ${err}`);
  }

  const visionData = await visionRes.json();
  const description = visionData.choices[0]?.message?.content?.trim() ?? "";

  // Step 2: Embed the description
  const embedding = await generateTextEmbedding(description);

  return { embedding, description };
}

/**
 * Describe an image from a URL using OpenAI Vision.
 */
export async function generateImageEmbeddingFromUrl(
  imageUrl: string,
): Promise<{ embedding: number[]; description: string }> {
  const visionRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: VISION_MODEL,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Describe this product image for a price comparison search engine. Include the brand name, product type, color, and key features. Be concise (1-2 sentences).",
            },
            {
              type: "image_url",
              image_url: { url: imageUrl, detail: "low" },
            },
          ],
        },
      ],
      max_tokens: 150,
    }),
  });

  if (!visionRes.ok) {
    const err = await visionRes.text();
    throw new Error(`OpenAI vision error (${visionRes.status}): ${err}`);
  }

  const visionData = await visionRes.json();
  const description = visionData.choices[0]?.message?.content?.trim() ?? "";

  const embedding = await generateTextEmbedding(description);
  return { embedding, description };
}

export { EMBEDDING_DIM };
