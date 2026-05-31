import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AIGatewayError, callGateway, parseJsonLoose } from "@/lib/ai-gateway.server";
import { EMERGENCY_PHRASES, languageName } from "@/lib/languages";

const BodySchema = z.object({
  targetLang: z.string().min(2).max(8),
});

export type EmergencyPhrasesResult = {
  targetLang: string;
  phrases: Array<{
    id: string;
    en: string;
    translation: string;
    pronunciation: string;
  }>;
};

export const Route = createFileRoute("/api/emergency-phrases")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let parsed;
        try {
          parsed = BodySchema.parse(await request.json());
        } catch (err) {
          return Response.json({ error: "Invalid request", detail: String(err) }, { status: 400 });
        }

        const lang = languageName(parsed.targetLang);
        const list = EMERGENCY_PHRASES.map((p) => ({ id: p.id, en: p.en }));

        try {
          const content = await callGateway({
            responseJson: true,
            messages: [
              {
                role: "user",
                content: `Translate each of these emergency phrases into ${lang}. Respond ONLY with valid JSON of the form:
{
  "phrases": [
    { "id": "<id>", "translation": "<phrase in ${lang}, in its native script>", "pronunciation": "<romanized phonetic pronunciation for an English speaker, or empty string if ${lang} already uses Latin script>" }
  ]
}
Source phrases (id → English):
${list.map((p) => `- ${p.id}: ${p.en}`).join("\n")}
No markdown. No commentary.`,
              },
            ],
          });
          const raw = parseJsonLoose<{
            phrases: Array<{ id: string; translation: string; pronunciation?: string }>;
          }>(content);

          const byId = new Map(raw.phrases.map((p) => [p.id, p]));
          const result: EmergencyPhrasesResult = {
            targetLang: parsed.targetLang,
            phrases: EMERGENCY_PHRASES.map((p) => ({
              id: p.id,
              en: p.en,
              translation: byId.get(p.id)?.translation ?? p.en,
              pronunciation: byId.get(p.id)?.pronunciation ?? "",
            })),
          };
          return Response.json(result);
        } catch (err) {
          if (err instanceof AIGatewayError) {
            return Response.json({ error: err.message }, { status: err.status });
          }
          return Response.json({ error: "Failed", detail: String(err) }, { status: 500 });
        }
      },
    },
  },
});