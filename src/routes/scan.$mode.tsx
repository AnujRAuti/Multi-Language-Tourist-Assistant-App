import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, Camera, Loader2, Upload, Volume2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { VOICE_LOCALE } from "@/lib/languages";
import { usePrefs } from "@/lib/use-prefs";
import type { AnalyzeResult } from "@/routes/api/analyze";

export const Route = createFileRoute("/scan/$mode")({
  parseParams: (raw) => {
    const mode = raw.mode === "menu" ? "menu" : "sign";
    return { mode } as { mode: "sign" | "menu" };
  },
  head: ({ params }) => {
    const title = params.mode === "menu" ? "Decode Menu — TravelLens" : "Translate Sign — TravelLens";
    return {
      meta: [
        { title },
        {
          name: "description",
          content:
            params.mode === "menu"
              ? "Photograph a menu or dish to see what it is, with ingredients and allergens."
              : "Photograph any sign and get an instant translation plus practical context.",
        },
      ],
    };
  },
  component: ScanPage,
});

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

function speak(text: string, langCode: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = VOICE_LOCALE[langCode] ?? langCode;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

function ScanPage() {
  const { mode } = Route.useParams();
  const { prefs } = usePrefs();
  const navigate = useNavigate();
  const [preview, setPreview] = useState<string | null>(null);
  const [mime, setMime] = useState<string>("image/jpeg");
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const isMenu = mode === "menu";
  const title = isMenu ? "Decode Menu" : "Translate Sign";
  const kicker = isMenu ? "Gastronomy AI" : "Visual Recognition";

  async function onFile(file: File | undefined | null) {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image is too large (max 8 MB).");
      return;
    }
    setResult(null);
    setMime(file.type || "image/jpeg");
    const dataUrl = await fileToDataUrl(file);
    setPreview(dataUrl);
  }

  async function analyze() {
    if (!preview) return;
    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: preview,
          mimeType: mime,
          mode,
          targetLang: prefs.myLang,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(err.error ?? `Failed (${res.status})`);
        return;
      }
      const data = (await res.json()) as AnalyzeResult;
      setResult(data);
    } catch (err) {
      toast.error(`Network error: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setPreview(null);
    setResult(null);
  }

  return (
    <AppShell>
      <main className="flex-1 px-6 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="size-9 rounded-full border border-border flex items-center justify-center hover:bg-foreground/5"
            aria-label="Back"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {kicker}
            </p>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          </div>
        </div>

        {!preview && (
          <div className="space-y-4 animate-in-up">
            <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center">
              <Camera className="size-10 mx-auto text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground text-pretty leading-relaxed">
                Take a photo of the {isMenu ? "menu or dish" : "sign or notice"}, or upload one from your gallery.
              </p>
            </div>

            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="w-full py-4 bg-foreground text-background font-bold rounded-full flex items-center justify-center gap-2"
            >
              <Camera className="size-4" /> Take photo
            </button>
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              className="w-full py-4 border border-border font-bold rounded-full flex items-center justify-center gap-2"
            >
              <Upload className="size-4" /> Upload image
            </button>
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            <input
              ref={galleryRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </div>
        )}

        {preview && (
          <div className="space-y-4 animate-in-up">
            <div className="flex items-center gap-2">
              {loading ? (
                <>
                  <Loader2 className="size-3 animate-spin text-accent" />
                  <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    Analyzing
                  </p>
                </>
              ) : (
                <>
                  <div className="size-2 bg-accent rounded-full" />
                  <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    Ready
                  </p>
                </>
              )}
            </div>

            <div className="rounded-2xl overflow-hidden relative border border-border bg-foreground/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Captured" className="w-full aspect-[4/3] object-cover" />
              {!result && !loading && (
                <div className="absolute inset-0 border-2 border-accent/40 m-6 rounded-sm pointer-events-none" />
              )}
            </div>

            {!result && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={reset}
                  disabled={loading}
                  className="py-4 border border-border font-bold rounded-full disabled:opacity-50"
                >
                  Retake
                </button>
                <button
                  type="button"
                  onClick={analyze}
                  disabled={loading}
                  className="py-4 bg-foreground text-background font-bold rounded-full disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="size-4 animate-spin" /> : "Analyze"}
                </button>
              </div>
            )}

            {result && <ResultCard result={result} myLang={prefs.myLang} onReset={reset} />}
          </div>
        )}
      </main>

      <footer className="py-8 px-6 text-center">
        <Link
          to="/"
          className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest"
        >
          ← Home
        </Link>
      </footer>
    </AppShell>
  );
}

function ResultCard({
  result,
  myLang,
  onReset,
}: {
  result: AnalyzeResult;
  myLang: string;
  onReset: () => void;
}) {
  const hasMenu = result.ingredients?.length || result.allergens?.length || result.spiceLevel;

  return (
    <div className="space-y-4 animate-in-up">
      <div>
        <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
          Detected text ({result.sourceLanguage})
        </span>
        <p className="text-xl font-bold mt-1 break-words">{result.detectedText || "—"}</p>
      </div>
      <div>
        <span className="font-mono text-[10px] text-accent uppercase tracking-widest">
          Translation
        </span>
        <p className="text-2xl font-bold mt-1 text-pretty">{result.translation}</p>
      </div>
      <div className="p-4 bg-foreground/5 rounded-xl border border-border">
        <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
          {result.explanation}
        </p>
      </div>

      {hasMenu ? (
        <div className="p-4 rounded-xl border border-border bg-card space-y-3">
          {result.ingredients && result.ingredients.length > 0 && (
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Ingredients
              </span>
              <p className="text-sm mt-1">{result.ingredients.join(" · ")}</p>
            </div>
          )}
          {result.allergens && result.allergens.length > 0 && (
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-emergency font-bold">
                Allergens
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {result.allergens.map((a) => (
                  <span
                    key={a}
                    className="text-xs font-bold bg-emergency/10 text-emergency px-2 py-1 rounded-full"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}
          {result.spiceLevel && result.spiceLevel !== "unknown" && (
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Spice level
              </span>
              <p className="text-sm mt-1 font-bold capitalize">{result.spiceLevel}</p>
            </div>
          )}
        </div>
      ) : null}

      {result.warnings && result.warnings.length > 0 && (
        <div className="p-4 rounded-xl border border-emergency/30 bg-emergency/10 flex gap-3">
          <AlertTriangle className="size-4 text-emergency flex-shrink-0 mt-0.5" />
          <ul className="space-y-1 text-sm text-emergency">
            {result.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          type="button"
          onClick={() => speak(result.translation, myLang)}
          className="py-4 border border-border font-bold rounded-full flex items-center justify-center gap-2"
        >
          <Volume2 className="size-4" /> Speak
        </button>
        <button
          type="button"
          onClick={onReset}
          className="py-4 bg-foreground text-background font-bold rounded-full"
        >
          New scan
        </button>
      </div>
    </div>
  );
}