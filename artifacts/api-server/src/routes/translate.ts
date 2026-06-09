import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, translationRecordsTable } from "@workspace/db";
import {
  TranslateTextBody,
  TranslateTextResponse,
  ListTranslationHistoryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  ru: "Russian",
  ja: "Japanese",
  ko: "Korean",
  zh: "Chinese",
  ar: "Arabic",
  hi: "Hindi",
  nl: "Dutch",
  pl: "Polish",
  tr: "Turkish",
  sv: "Swedish",
  uk: "Ukrainian",
  vi: "Vietnamese",
};

router.get("/translate/history", async (_req, res): Promise<void> => {
  const records = await db
    .select()
    .from(translationRecordsTable)
    .orderBy(desc(translationRecordsTable.createdAt))
    .limit(50);

  res.json(
    ListTranslationHistoryResponse.parse(
      records.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))
    )
  );
});

router.post("/translate", async (req, res): Promise<void> => {
  const parsed = TranslateTextBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { text, targetLanguage, sourceLanguage = "auto" } = parsed.data;
  const detectedSource = sourceLanguage === "auto" ? detectLanguage(text) : sourceLanguage;
  const translatedText = await translateWithClaude(text, targetLanguage, detectedSource);

  await db.insert(translationRecordsTable).values({
    originalText: text,
    translatedText,
    sourceLanguage: detectedSource,
    targetLanguage,
  });

  res.json(
    TranslateTextResponse.parse({
      originalText: text,
      translatedText,
      sourceLanguage: detectedSource,
      targetLanguage,
    })
  );
});

function detectLanguage(text: string): string {
  if (/[\u4e00-\u9fff]/.test(text)) return "zh";
  if (/[\u3040-\u30ff]/.test(text)) return "ja";
  if (/[\uac00-\ud7af]/.test(text)) return "ko";
  if (/[\u0400-\u04ff]/.test(text)) return "ru";
  if (/[\u0600-\u06ff]/.test(text)) return "ar";
  if (/[\u0900-\u097f]/.test(text)) return "hi";
  return "en";
}

async function translateWithClaude(text: string, targetLang: string, sourceLang: string): Promise<string> {
  const targetName = LANGUAGE_NAMES[targetLang] ?? targetLang;
  const sourceName = LANGUAGE_NAMES[sourceLang] ?? sourceLang;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: `You are a precise translator. Translate the text from ${sourceName} to ${targetName}. Return ONLY the translated text, no explanations, notes, or quotation marks.`,
        messages: [{ role: "user", content: text }],
      }),
    });

    if (!response.ok) {
      return fallbackTranslation(text, targetLang);
    }

    const data = (await response.json()) as {
      content: Array<{ type: string; text: string }>;
    };
    const translated = data.content.find((c) => c.type === "text")?.text?.trim();
    return translated ?? fallbackTranslation(text, targetLang);
  } catch {
    return fallbackTranslation(text, targetLang);
  }
}

function fallbackTranslation(text: string, targetLang: string): string {
  return `[${LANGUAGE_NAMES[targetLang] ?? targetLang} translation] ${text}`;
}

export default router;
