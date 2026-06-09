import { Router, type IRouter } from "express";
import { db, chatMessagesTable } from "@workspace/db";
import {
  SendChatMessageBody,
  ListChatMessagesResponse,
  SendChatMessageResponse,
} from "@workspace/api-zod";

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
    history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    parsed.data.message
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
  history: Array<{ role: "user" | "assistant"; content: string }>,
  userMessage: string
): Promise<string> {
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
        max_tokens: 800,
        system: `You are a helpful personal AI assistant integrated into LifeApp — an all-in-one life management platform. 
You help users with daily tasks, planning, learning new skills, language questions, reminders, and general life advice. 
Be concise, practical, and warm. You can help organize tasks, suggest learning topics, assist with translations, or just have a supportive conversation.
Today's date is ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.`,
        messages: history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!response.ok) {
      return getOfflineResponse(userMessage);
    }

    const data = (await response.json()) as {
      content: Array<{ type: string; text: string }>;
    };
    const text = data.content.find((c) => c.type === "text")?.text?.trim();
    return text ?? getOfflineResponse(userMessage);
  } catch {
    return getOfflineResponse(userMessage);
  }
}

function getOfflineResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
    return "Hello! I'm your personal assistant. How can I help you today? I can assist with tasks, learning, translations, or just about anything else.";
  }
  if (lower.includes("task") || lower.includes("todo")) {
    return "I can help you manage your tasks! Head over to the Tasks section to create, prioritize, and track your to-dos. Would you like any tips on staying organized?";
  }
  if (lower.includes("learn") || lower.includes("skill")) {
    return "The Skills section has lessons on a wide range of everyday topics. Is there a particular skill you'd like to focus on?";
  }
  if (lower.includes("translat")) {
    return "You can translate text in the Translate section! It supports over 15 languages. What would you like to translate?";
  }
  if (lower.includes("note")) {
    return "You can jot down notes in the Notes section. It's a great place to capture ideas, reminders, and important information.";
  }
  if (lower.includes("help")) {
    return "I'm here to help! LifeApp has four main areas: Tasks (daily planning), Skills (learning), Translate (language help), and Notes (capture ideas). What would you like to explore?";
  }
  return "I'm your personal AI assistant. I'm here to help with tasks, learning, language translation, and more. What's on your mind today?";
}

export default router;
