import { redis } from './_google.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { id, delta } = req.body || {}
  if (!/^[\w-]{6,64}$/.test(id || '') || ![1, -1].includes(delta)) return res.status(400).json({ error: 'Bad request' })
  try {
    let n = await redis('HINCRBY', 'likes', id, delta)
    if (n === null) return res.status(500).json({ error: 'Likes database not configured' })
    if (n < 0) n = await redis('HINCRBY', 'likes', id, -n) // never below zero
    res.json({ likes: n })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
