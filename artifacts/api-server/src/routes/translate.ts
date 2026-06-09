import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, translationRecordsTable } from "@workspace/db";
import {
  TranslateTextBody,
  TranslateTextResponse,
  ListTranslationHistoryResponse,
} from "@workspace/api-zod";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const GROQ_MODEL = "llama-3.3-70b-versatile";

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
  const translatedText = await translateWithGroq(text, targetLanguage, detectedSource);

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

async function translateWithGroq(text: string, targetLang: string, sourceLang: string): Promise<string> {
  const targetName = LANGUAGE_NAMES[targetLang] ?? targetLang;
  const sourceName = LANGUAGE_NAMES[sourceLang] ?? sourceLang;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return fallbackTranslation(text, targetLang);
  }

  const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      max_tokens: 1000,
      messages: [
        {
          role: "system",
          content: `You are a precise translator. Translate the text from ${sourceName} to ${targetName}. Return ONLY the translated text, no explanations, notes, or quotation marks.`,
        },
        { role: "user", content: text },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Groq API error ${response.status}: ${body}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0]?.message?.content?.trim() ?? fallbackTranslation(text, targetLang);
}

function fallbackTranslation(text: string, targetLang: string): string {
  return `[${LANGUAGE_NAMES[targetLang] ?? targetLang} translation] ${text}`;
}

export default router;
