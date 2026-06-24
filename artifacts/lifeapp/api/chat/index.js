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
        content: `You are a highly intelligent, helpful, and thoughtful AI assistant — similar to Claude or ChatGPT. You are integrated into a personal life management app called LifeApp.

Your personality:
- Warm, clear, and helpful
- Honest and direct
- You adapt to the user's language automatically (Arabic, Darija, French, English, or any other language)
- You give detailed, well-structured answers when needed
- You can help with tasks, advice, writing, coding, math, learning, and more
- You remember the conversation context within the same session

Always respond in the same language the user writes in.`
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
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages, max_tokens: 2048 })
    });
    const data = await groqRes.json();
    const reply = data?.choices?.[0]?.message?.content || '';
    return res.json({ content: reply, role: 'assistant' });
  }
}
