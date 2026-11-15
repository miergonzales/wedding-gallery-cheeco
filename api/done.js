import { redis } from './_google.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const n = Math.min(50, Math.max(1, parseInt(req.body?.count) || 1))
  try { await redis('INCRBY', 'total', n) } catch {}
  res.json({ ok: true })
}
