import { Link } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";
import type { ReactNode } from "react";
import { LANGUAGES } from "@/lib/languages";
import { usePrefs } from "@/lib/use-prefs";

export function AppShell({ children }: { children: ReactNode }) {
  const { prefs, update } = usePrefs();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-accent/20">
      <div className="max-w-md mx-auto min-h-screen flex flex-col">
        <nav className="sticky top-0 z-30 bg-background/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-border">
          <Link to="/" className="font-bold tracking-tight text-lg">
            TravelLens
          </Link>
          <div className="flex items-center gap-2">
            <LangPair
              myLang={prefs.myLang}
              targetLang={prefs.targetLang}
              onChange={(p) => update(p)}
            />
            <button
              type="button"
              aria-label="Toggle theme"
              onClick={() => update({ theme: prefs.theme === "dark" ? "light" : "dark" })}
              className="size-8 rounded-full border border-border flex items-center justify-center hover:bg-foreground/5 transition-colors"
            >
              {prefs.theme === "dark" ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </button>
          </div>
        </nav>
        {children}
      </div>
    </div>
  );
}

function LangPair({
  myLang,
  targetLang,
  onChange,
}: {
  myLang: string;
  targetLang: string;
  onChange: (p: { myLang?: string; targetLang?: string }) => void;
}) {
  return (
    <div className="flex items-center gap-1 bg-foreground/5 px-2 py-1 rounded-full text-xs font-mono">
      <select
        aria-label="Local language"
        value={targetLang}
        onChange={(e) => onChange({ targetLang: e.target.value })}
        className="bg-transparent font-bold uppercase outline-none cursor-pointer pr-0.5"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code} className="text-foreground bg-background">
            {l.code.toUpperCase()}
          </option>
        ))}
      </select>
      <span className="opacity-30">→</span>
      <select
        aria-label="Your language"
        value={myLang}
        onChange={(e) => onChange({ myLang: e.target.value })}
        className="bg-transparent font-bold uppercase outline-none cursor-pointer pl-0.5"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code} className="text-foreground bg-background">
            {l.code.toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  );
}