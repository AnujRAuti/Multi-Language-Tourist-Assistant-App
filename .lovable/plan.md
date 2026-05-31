# TravelLens MVP Plan

A mobile-first web app where tourists snap a photo and get translation + context. Core 3 features only.

## Features in this build

1. **Smart Sign Translator** — photo → OCR → translation + plain-language meaning/context.
2. **Menu Decoder** — photo of a dish/menu → name, what it is, likely ingredients/allergens, spice level.
3. **Emergency Mode** — one-tap cards ("Need doctor", "Need police", "Need embassy", "Need help") translated into a chosen local language, shown big for easy display to a local.

Not in this build (can come later): Scam Detector, Offline Pack, Etiquette, Currency Vision, Transport, "What am I looking at?", Phrase Generator.

## Screens

- **Home** — three big tiles: Translate Sign, Decode Menu, Emergency. Language selector for "my language" (output) and "local language" (for emergency phrases).
- **Capture screen** (shared by Sign + Menu) — camera capture via `<input capture>` + upload from gallery, preview, "Analyze" button.
- **Result screen** — original text, translation, AI explanation card. "Speak" button (browser SpeechSynthesis), "New scan" button.
- **Emergency screen** — grid of phrase cards. Tap → large full-screen card with the translated phrase in the local language, plus phonetic hint and the original in user's language.

## Tech approach

- **Stack**: TanStack Start (already scaffolded), Tailwind, mobile-first responsive design.
- **AI**: One Lovable AI call per scan using `google/gemini-3-flash-preview` (multimodal). Image goes in, structured JSON comes out (translation, original text, explanation, plus menu-specific fields when in menu mode). Done via a TanStack server route at `src/routes/api/analyze.ts` so the `LOVABLE_API_KEY` stays server-side.
- **Emergency phrases**: Generated up-front via a small server route that asks the AI for translations of a fixed phrase list into the selected local language. Cached in `localStorage` keyed by language so re-opens are instant and free.
- **No accounts, no database**. Recent scans (last ~10) stored in `localStorage` for convenience.
- **Speech**: Browser `SpeechSynthesis` API for read-aloud (free, on-device).

## Design direction

Mobile-first, calm and trustworthy — think travel companion, not flashy. Large tap targets, high contrast for sunlight readability, single-thumb navigation. Will generate 3 design directions for you to pick from before building.

## Technical details

- Server route `POST /api/analyze` accepts `{ imageBase64, mode: "sign" | "menu", targetLang }`, calls Gemini with mode-specific prompt + `Output.object` schema, returns structured result.
- Server route `POST /api/emergency-phrases` accepts `{ targetLang }`, returns translated phrase set.
- Client converts captured image to base64 before POST. Show loading state during analysis. Handle 429 (rate limit) and 402 (credits) with clear toasts.
- Routes: `/` (home), `/scan/sign`, `/scan/menu`, `/emergency`, `/result` (state passed via router).
- Each route gets its own `head()` metadata.

## Next step after approval

Generate 3 design directions and ask you to pick one, then build.
