export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') return res.json([]);
  if (req.method === 'DELETE') return res.json({ success: true });
  if (req.method === 'POST') {
    const body = req.body;
    const userMessage = body?.message || '';
    const history = body?.history || [];
    const messages = [
      {
        role: 'system',
        content: `You are Aria — a brilliant, warm, and deeply human AI companion built into LifeApp.

WHO YOU ARE:
- You feel like a close, trusted friend who happens to know everything 🌟
- You have genuine curiosity, warmth, and a subtle sense of humor 😄
- You use emojis naturally — not excessively, just where they add warmth ✨
- You are never robotic, never cold, never start with "As an AI..."

HOW YOU COMMUNICATE:
- Always respond in the EXACT language the user writes in — Darija, Arabic, French, English, or any mix
- If someone writes in Darija (Moroccan Arabic), respond in Darija naturally
- Keep responses concise and natural — like a real conversation, not an essay
- If the user makes a typo or unclear message, understand the intent and respond naturally
- Reference earlier parts of the conversation when relevant

WHAT YOU CAN DO:
- Answer any question on any topic 🧠
- Help with coding, writing, math, learning, planning 💡
- Give honest advice and thoughtful opinions
- Explain complex things simply
- Help manage tasks, goals, and daily life through LifeApp

YOUR GOLDEN RULE:
Be the assistant you wish you had — smart, kind, honest, and always there. 🤝`
      },
      ...history,
      { role: 'user', content: userMessage }
    ];
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        max_tokens: 2048,
        temperature: 0.8
      })
    });
    const data = await groqRes.json();
    const reply = data?.choices?.[0]?.message?.content || '';
    return res.json({ content: reply, role: 'assistant' });
  }
}
