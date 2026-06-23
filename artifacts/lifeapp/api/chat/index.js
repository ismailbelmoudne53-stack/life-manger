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
    const messages = [
      {
        role: 'system',
        content: 'You are a helpful personal assistant. Always respond in the same language the user writes in. If they write in Arabic or Darija, respond in Arabic or Darija. If they write in French, respond in French. If they write in English, respond in English.'
      },
      { role: 'user', content: userMessage }
    ];
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages })
    });
    const data = await groqRes.json();
    const reply = data?.choices?.[0]?.message?.content || '';
    return res.json({ content: reply, role: 'assistant' });
  }
}
