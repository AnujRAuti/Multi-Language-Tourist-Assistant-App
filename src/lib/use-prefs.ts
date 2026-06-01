import { useEffect, useState } from "react";

type Prefs = {
  targetLang: string; // local language (where the user is)
  myLang: string;     // user's own language for output
  theme: "light" | "dark";
};

const KEY = "travellens.prefs.v1";

const DEFAULTS: Prefs = {
  targetLang: "ja",
  myLang: "en",
  theme: "light",
};

function read(): Prefs {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Prefs>) };
  } catch {
    return DEFAULTS;
  }
}

// Module-level store so every usePrefs() consumer stays in sync.
let current: Prefs = DEFAULTS;
const listeners = new Set<(p: Prefs) => void>();

function setAll(next: Prefs) {
  current = next;
  listeners.forEach((l) => l(next));
}

export function usePrefs() {
  const [prefs, setPrefs] = useState<Prefs>(current);

  useEffect(() => {
    // Hydrate from storage on first mount, then broadcast.
    if (listeners.size === 0) {
      current = read();
    }
    setPrefs(current);
    const listener = (p: Prefs) => setPrefs(p);
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setAll(read());
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", prefs.theme === "dark");
  }, [prefs.theme]);

  const update = (patch: Partial<Prefs>) => {
    const next = { ...current, ...patch };
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // ignore quota / private mode errors
    }
    setAll(next);
  };

  return { prefs, update };
}