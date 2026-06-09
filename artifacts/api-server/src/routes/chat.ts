import { Router, type IRouter } from "express";
import { db, chatMessagesTable } from "@workspace/db";
import {
  SendChatMessageBody,
  ListChatMessagesResponse,
  SendChatMessageResponse,
} from "@workspace/api-zod";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const GROQ_MODEL = "llama-3.3-70b-versatile";

const router: IRouter = Router();

router.get("/chat", async (_req, res): Promise<void> => {
  const messages = await db
    .select()
    .from(chatMessagesTable)
    .orderBy(chatMessagesTable.createdAt)
    .limit(100);

  res.json(
    ListChatMessagesResponse.parse(
      messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))
    )
  );
});

router.post("/chat", async (req, res): Promise<void> => {
  const parsed = SendChatMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await db
    .insert(chatMessagesTable)
    .values({ role: "user", content: parsed.data.message });

  const history = await db
    .select()
    .from(chatMessagesTable)
    .orderBy(chatMessagesTable.createdAt)
    .limit(20);

  const aiReply = await getAIResponse(
    history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))
  );

  const [assistantMsg] = await db
    .insert(chatMessagesTable)
    .values({ role: "assistant", content: aiReply })
    .returning();

  res.json(
    SendChatMessageResponse.parse({
      ...assistantMsg,
      createdAt: assistantMsg.createdAt.toISOString(),
    })
  );
});

router.delete("/chat/clear", async (_req, res): Promise<void> => {
  await db.delete(chatMessagesTable);
  res.sendStatus(204);
});

async function getAIResponse(
  history: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return "AI assistant is not configured. Please add a GROQ_API_KEY to enable live responses.";
  }

  const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      max_tokens: 800,
      messages: [
        {
          role: "system",
          content: `You are a helpful personal AI assistant integrated into LifeApp — an all-in-one life management platform.
You help users with daily tasks, planning, learning new skills, language questions, reminders, and general life advice.
Be concise, practical, and warm. You can help organize tasks, suggest learning topics, assist with translations, or just have a supportive conversation.
Today's date is ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.`,
        },
        ...history.slice(-10),
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
  return data.choices[0]?.message?.content?.trim() ?? "No response received.";
}

export default router;
