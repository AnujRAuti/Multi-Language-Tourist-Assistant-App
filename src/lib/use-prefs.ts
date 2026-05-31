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

export function usePrefs() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);

  useEffect(() => {
    setPrefs(read());
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", prefs.theme === "dark");
  }, [prefs.theme]);

  const update = (patch: Partial<Prefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      try {
        window.localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        // ignore quota / private mode errors
      }
      return next;
    });
  };

  return { prefs, update };
}