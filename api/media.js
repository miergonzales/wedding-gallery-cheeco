import { getToken, redis } from './_google.js'

// Newest-first, 8 files per page (Drive page tokens), plus like counts from Redis.
export default async function handler(req, res) {
  try {
    const q = new URLSearchParams({
      q: `'${process.env.DRIVE_FOLDER_ID}' in parents and trashed=false and (mimeType contains 'image/' or mimeType contains 'video/')`,
      orderBy: 'createdTime desc',
      pageSize: '8',
      fields: 'nextPageToken,files(id,mimeType,createdTime,description,appProperties)',
    })
    if (req.query.pageToken) q.set('pageToken', req.query.pageToken)

    const r = await fetch(`https://www.googleapis.com/drive/v3/files?${q}`, {
      headers: { Authorization: `Bearer ${await getToken()}` },
    })
    const j = await r.json()
    if (!r.ok) return res.status(500).json({ error: j.error?.message || 'Drive error' })

    const files = j.files || []
    const keys = files.map((f) => f.appProperties?.batch || f.id)
    let counts = [], total = 0
    try {
      if (keys.length) counts = (await redis('HMGET', 'likes', ...keys)) || []
      if (!req.query.pageToken) total = Number(await redis('GET', 'total')) || 0
    } catch {}

    res.setHeader('Cache-Control', 'no-store')
    res.json({
      total,
      items: files.map((f, i) => ({
        id: f.id,
        key: keys[i],
        type: f.mimeType.startsWith('video') ? 'video' : 'image',
        guest: f.appProperties?.guest || 'Guest',
        caption: f.description || '',
        createdAt: f.createdTime,
        likes: Number(counts[i]) || 0,
      })),
      next: j.nextPageToken || null,
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
