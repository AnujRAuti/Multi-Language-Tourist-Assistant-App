const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

type GatewayMessage = {
  role: "system" | "user" | "assistant";
  content:
    | string
    | Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      >;
};

export class AIGatewayError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function callGateway(opts: {
  model?: string;
  messages: GatewayMessage[];
  responseJson?: boolean;
}): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new AIGatewayError(500, "Missing LOVABLE_API_KEY");

  const body: Record<string, unknown> = {
    model: opts.model ?? "google/gemini-3-flash-preview",
    messages: opts.messages,
  };
  if (opts.responseJson) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 429) {
      throw new AIGatewayError(429, "Rate limit reached. Please wait a moment and try again.");
    }
    if (res.status === 402) {
      throw new AIGatewayError(402, "AI credits exhausted. Add credits in Workspace settings.");
    }
    throw new AIGatewayError(res.status, `AI gateway error (${res.status}): ${text.slice(0, 300)}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new AIGatewayError(502, "No response content from AI gateway");
  return content;
}

export function parseJsonLoose<T>(text: string): T {
  // Strip ```json fences if present
  let s = text.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  }
  return JSON.parse(s) as T;
}