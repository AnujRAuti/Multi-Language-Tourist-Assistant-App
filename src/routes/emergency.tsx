import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Volume2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { EMERGENCY_PHRASES, VOICE_LOCALE, languageName } from "@/lib/languages";
import { usePrefs } from "@/lib/use-prefs";
import type { EmergencyPhrasesResult } from "@/routes/api/emergency-phrases";

export const Route = createFileRoute("/emergency")({
  head: () => ({
    meta: [
      { title: "Emergency phrases — TravelLens" },
      {
        name: "description",
        content:
          "One-tap emergency phrases translated into the local language. Show a card to a local when you need help.",
      },
    ],
  }),
  component: EmergencyPage,
});

function cacheKey(lang: string) {
  return `travellens.emergency.${lang}.v1`;
}

function speak(text: string, langCode: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = VOICE_LOCALE[langCode] ?? langCode;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

function EmergencyPage() {
  const { prefs } = usePrefs();
  const navigate = useNavigate();
  const [data, setData] = useState<EmergencyPhrasesResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);

    // Try cache first
    try {
      const raw = window.localStorage.getItem(cacheKey(prefs.targetLang));
      if (raw) {
        const cached = JSON.parse(raw) as EmergencyPhrasesResult;
        setData(cached);
        return () => {
          cancelled = true;
        };
      }
    } catch {
      // ignore
    }

    setLoading(true);
    fetch("/api/emergency-phrases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetLang: prefs.targetLang }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(err.error ?? `Failed (${res.status})`);
        }
        return (await res.json()) as EmergencyPhrasesResult;
      })
      .then((d) => {
        if (cancelled) return;
        setData(d);
        try {
          window.localStorage.setItem(cacheKey(prefs.targetLang), JSON.stringify(d));
        } catch {
          // ignore
        }
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error(String(err.message ?? err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [prefs.targetLang]);

  const activePhrase = data?.phrases.find((p) => p.id === active);

  return (
    <AppShell>
      <main className="flex-1 bg-emergency text-emergency-foreground -mt-px">
        <div className="px-6 py-8">
          <div className="flex items-center gap-3 mb-8">
            <button
              type="button"
              onClick={() => navigate({ to: "/" })}
              className="size-9 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10"
              aria-label="Back"
            >
              <ArrowLeft className="size-4" />
            </button>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest opacity-80">
                Emergency
              </p>
              <h1 className="text-2xl font-bold tracking-tight">
                Show to a local · {languageName(prefs.targetLang)}
              </h1>
            </div>
          </div>

          {loading && !data && (
            <div className="flex items-center gap-2 text-sm opacity-80">
              <Loader2 className="size-4 animate-spin" /> Preparing phrases…
            </div>
          )}

          <div className="space-y-3">
            {(data?.phrases ?? EMERGENCY_PHRASES.map((p) => ({
              id: p.id,
              en: p.en,
              translation: "",
              pronunciation: "",
            }))).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => p.translation && setActive(p.id)}
                disabled={!p.translation}
                className="w-full text-left bg-white/10 hover:bg-white/15 disabled:opacity-60 disabled:cursor-not-allowed p-5 rounded-2xl border border-white/15 transition-colors"
              >
                <p className="text-xs font-mono uppercase tracking-widest opacity-70 mb-1">
                  {p.en}
                </p>
                <p className="text-xl font-bold leading-tight text-pretty">
                  {p.translation || "…"}
                </p>
                {p.pronunciation && (
                  <p className="text-sm opacity-70 mt-1">{p.pronunciation}</p>
                )}
              </button>
            ))}
          </div>
        </div>

        <footer className="py-8 px-6 text-center">
          <Link
            to="/"
            className="font-mono text-[10px] opacity-70 uppercase tracking-widest"
          >
            ← Home
          </Link>
        </footer>
      </main>

      {activePhrase && (
        <div className="fixed inset-0 z-50 bg-emergency text-emergency-foreground flex flex-col p-6">
          <button
            type="button"
            onClick={() => setActive(null)}
            className="self-end size-10 rounded-full border border-white/30 flex items-center justify-center"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
            <p className="font-mono text-xs uppercase tracking-widest opacity-70">
              {activePhrase.en}
            </p>
            <p className="text-5xl font-bold leading-[1.1] text-pretty tracking-tight max-w-[90%]">
              {activePhrase.translation}
            </p>
            {activePhrase.pronunciation && (
              <p className="text-xl opacity-80">{activePhrase.pronunciation}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => speak(activePhrase.translation, prefs.targetLang)}
            className="w-full py-4 bg-white text-emergency font-bold rounded-full flex items-center justify-center gap-2"
          >
            <Volume2 className="size-4" /> Speak aloud
          </button>
        </div>
      )}
    </AppShell>
  );
}