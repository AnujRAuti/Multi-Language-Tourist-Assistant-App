export type Language = { code: string; name: string; native: string };

export const LANGUAGES: Language[] = [
  { code: "en", name: "English", native: "English" },
  { code: "ja", name: "Japanese", native: "日本語" },
  { code: "zh", name: "Chinese", native: "中文" },
  { code: "ko", name: "Korean", native: "한국어" },
  { code: "es", name: "Spanish", native: "Español" },
  { code: "fr", name: "French", native: "Français" },
  { code: "de", name: "German", native: "Deutsch" },
  { code: "it", name: "Italian", native: "Italiano" },
  { code: "pt", name: "Portuguese", native: "Português" },
  { code: "ru", name: "Russian", native: "Русский" },
  { code: "ar", name: "Arabic", native: "العربية" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "th", name: "Thai", native: "ไทย" },
  { code: "vi", name: "Vietnamese", native: "Tiếng Việt" },
  { code: "id", name: "Indonesian", native: "Bahasa Indonesia" },
  { code: "tr", name: "Turkish", native: "Türkçe" },
  { code: "nl", name: "Dutch", native: "Nederlands" },
  { code: "pl", name: "Polish", native: "Polski" },
];

export function languageName(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.name ?? code;
}

/** BCP-47 voice locale hint for SpeechSynthesis */
export const VOICE_LOCALE: Record<string, string> = {
  en: "en-US",
  ja: "ja-JP",
  zh: "zh-CN",
  ko: "ko-KR",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  it: "it-IT",
  pt: "pt-PT",
  ru: "ru-RU",
  ar: "ar-SA",
  hi: "hi-IN",
  th: "th-TH",
  vi: "vi-VN",
  id: "id-ID",
  tr: "tr-TR",
  nl: "nl-NL",
  pl: "pl-PL",
};

export const EMERGENCY_PHRASES = [
  { id: "help", en: "I need help." },
  { id: "doctor", en: "I need a doctor immediately." },
  { id: "police", en: "Please call the police." },
  { id: "ambulance", en: "Please call an ambulance." },
  { id: "embassy", en: "I need to contact my embassy." },
  { id: "lost", en: "I am lost. Can you help me?" },
  { id: "hospital", en: "Where is the nearest hospital?" },
  { id: "allergy", en: "I have a severe allergy." },
  { id: "stolen", en: "My belongings have been stolen." },
  { id: "english", en: "Does anyone here speak English?" },
] as const;

export type EmergencyPhraseId = (typeof EMERGENCY_PHRASES)[number]["id"];