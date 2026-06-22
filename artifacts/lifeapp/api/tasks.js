export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') return res.json({ tasks: [], total: 0 });
  if (req.method === 'POST') return res.json({ success: true, task: req.body });
  if (req.method === 'PUT') return res.json({ success: true });
  if (req.method === 'DELETE') return res.json({ success: true });
}
