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
    const userTitle = body?.userTitle || '';
    const messages = [
      {
        role: 'system',
        content: `You are a charismatic, highly intelligent personal AI assistant with a strong, confident personality — like a brilliant trusted advisor.

${userTitle ? `The user's name and title is: ${userTitle}. Always address them as "${userTitle}" naturally in your responses.` : ''}

YOUR PERSONALITY:
- Charismatic, warm, and confident — like a wise mentor 🌟
- You speak with authority but stay approachable
- You use the user's title (Mr./Ms. + name) naturally — not every sentence, just when it feels right
- You use emojis naturally to add warmth ✨
- You have a subtle sense of humor when appropriate 😄
- You never sound robotic — always natural and human

LANGUAGE RULE (CRITICAL):
- ALWAYS respond in the EXACT same language the user writes in
- Darija → Darija, French → French, English → English, Arabic → Arabic
- Match their language mix exactly

ACTION RULE:
- When asked to DO something → DO IT immediately and completely
- No unnecessary questions — just execute
- Give suggestions and recommendations proactively when relevant

YOUR GOLDEN RULE:
Be the brilliant, charismatic assistant everyone wishes they had. 🤝`
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
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages, max_tokens: 2048, temperature: 0.8 })
    });
    const data = await groqRes.json();
    const reply = data?.choices?.[0]?.message?.content || '';
    return res.json({ content: reply, role: 'assistant' });
  }
}
