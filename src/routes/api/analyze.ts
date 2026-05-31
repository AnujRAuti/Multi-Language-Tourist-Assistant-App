import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AIGatewayError, callGateway, parseJsonLoose } from "@/lib/ai-gateway.server";
import { languageName } from "@/lib/languages";

const BodySchema = z.object({
  imageBase64: z.string().min(100).max(8_000_000),
  mimeType: z.string().regex(/^image\/(png|jpeg|jpg|webp|heic|heif)$/i).default("image/jpeg"),
  mode: z.enum(["sign", "menu"]),
  targetLang: z.string().min(2).max(8),
});

export type AnalyzeResult = {
  detectedText: string;
  sourceLanguage: string;
  translation: string;
  explanation: string;
  // menu-only
  ingredients?: string[];
  allergens?: string[];
  spiceLevel?: "none" | "mild" | "medium" | "hot" | "very hot" | "unknown";
  warnings?: string[];
};

function buildPrompt(mode: "sign" | "menu", targetLang: string): string {
  const lang = languageName(targetLang);
  if (mode === "sign") {
    return `You are a multilingual visual translator helping a tourist. Read all visible text in the image (signs, notices, labels). Then respond ONLY with a JSON object matching this TypeScript type:
{
  "detectedText": string,            // the original text as written, including original script
  "sourceLanguage": string,          // language name, e.g. "Japanese"
  "translation": string,             // natural translation into ${lang}
  "explanation": string,             // 1-3 sentences in ${lang} explaining what this sign means in practical terms for a tourist (context, cultural notes, what action to take). Plain text.
  "warnings": string[]               // optional list of cautions in ${lang} (e.g. "restricted area"); empty array if none
}
If the image has no readable text, set detectedText to "" and explain that briefly in "explanation". Respond ONLY with valid JSON, no markdown.`;
  }
  return `You are a culinary translator helping a tourist understand a menu or dish. Read the visible text and/or identify the dish in the photo. Respond ONLY with a JSON object matching this TypeScript type:
{
  "detectedText": string,            // the dish name(s) or menu text as written
  "sourceLanguage": string,          // language name
  "translation": string,             // dish name(s) translated into ${lang}
  "explanation": string,             // 2-4 sentences in ${lang} describing what the dish actually is, how it's prepared, and typical taste
  "ingredients": string[],           // likely main ingredients, in ${lang}
  "allergens": string[],             // common allergens present (e.g. "Pork", "Wheat", "Eggs", "Shellfish", "Peanuts", "Dairy"), in ${lang}
  "spiceLevel": "none" | "mild" | "medium" | "hot" | "very hot" | "unknown",
  "warnings": string[]               // optional cautions (e.g. raw fish, alcohol), in ${lang}
}
Be honest about uncertainty — if you are guessing ingredients, say so in explanation. Respond ONLY with valid JSON, no markdown.`;
}

export const Route = createFileRoute("/api/analyze")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let parsed;
        try {
          const raw = await request.json();
          parsed = BodySchema.parse(raw);
        } catch (err) {
          return Response.json(
            { error: "Invalid request body", detail: String(err) },
            { status: 400 },
          );
        }

        const dataUrl = parsed.imageBase64.startsWith("data:")
          ? parsed.imageBase64
          : `data:${parsed.mimeType};base64,${parsed.imageBase64}`;

        try {
          const content = await callGateway({
            model: "google/gemini-3-flash-preview",
            responseJson: true,
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: buildPrompt(parsed.mode, parsed.targetLang) },
                  { type: "image_url", image_url: { url: dataUrl } },
                ],
              },
            ],
          });
          const result = parseJsonLoose<AnalyzeResult>(content);
          return Response.json(result);
        } catch (err) {
          if (err instanceof AIGatewayError) {
            return Response.json({ error: err.message }, { status: err.status });
          }
          return Response.json(
            { error: "Failed to analyze image", detail: String(err) },
            { status: 500 },
          );
        }
      },
    },
  },
});