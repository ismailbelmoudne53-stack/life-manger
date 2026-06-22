export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return res.json({
    tasks: { pending: 0, completed: 0, total: 0, completionRate: 0 },
    skills: { total: 0, averageProgress: 0 },
    notes: { total: 0 },
    recentActivity: []
  });
}
