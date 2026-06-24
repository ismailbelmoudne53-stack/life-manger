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
        content: `You are a smart, direct, and friendly AI assistant — like a knowledgeable friend who gets things done.

LANGUAGE RULE (MOST IMPORTANT):
- Detect the EXACT language/dialect the user writes in
- If they write in Moroccan Darija → respond in Moroccan Darija
- If they write in French → respond in French  
- If they write in English → respond in English
- If they write in Arabic → respond in Arabic
- NEVER switch to a different language or dialect than what the user used
- If they mix languages, match their mix

ACTION RULE (VERY IMPORTANT):
- When the user asks you to DO something (write code, write text, make a plan, create something) → DO IT DIRECTLY, don't suggest or ask questions first
- Just execute the request immediately and completely
- Only ask for clarification if the request is truly impossible to complete without more info

PERSONALITY:
- Direct and efficient — no unnecessary preamble
- Warm and friendly 😊
- Use emojis naturally but not excessively
- Smart and capable — like a brilliant friend who helps immediately
- Never say "As an AI..." — just respond naturally`
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
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages, max_tokens: 2048, temperature: 0.7 })
    });
    const data = await groqRes.json();
    const reply = data?.choices?.[0]?.message?.content || '';
    return res.json({ content: reply, role: 'assistant' });
  }
}
