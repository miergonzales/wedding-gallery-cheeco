export async function fetchPage(pageToken) {
  const r = await fetch('/api/media' + (pageToken ? `?pageToken=${encodeURIComponent(pageToken)}` : ''))
  if (!r.ok) throw new Error('Could not load the feed')
  return r.json()
}

export async function uploadFile(file, meta, onProgress) {
  const s = await fetch('/api/upload-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: file.name, mimeType: file.type, size: file.size, ...meta }),
  })
  if (!s.ok) throw new Error((await s.json().catch(() => ({}))).error || 'Could not start upload')
  const { url } = await s.json()

  return new Promise((resolve, reject) => {
    const x = new XMLHttpRequest()
    x.open('PUT', url)
    x.setRequestHeader('Content-Type', file.type)
    x.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total)
    x.onload = () => (x.status < 300 ? resolve(JSON.parse(x.responseText)) : reject(new Error('Upload failed')))
    x.onerror = () => reject(new Error('Network error'))
    x.send(file)
  })
}

export const markDone = (count) =>
  fetch('/api/done', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ count }) }).catch(() => {})

// Files uploaded together share a batch key, so they become one multi-photo post.
export function mergeGroups(groups, items) {
  const out = [...groups]
  for (const it of items) {
    const m = { id: it.id, type: it.type, createdAt: it.createdAt }
    const i = out.findIndex((g) => g.key === it.key)
    if (i < 0) out.push({ key: it.key, guest: it.guest, caption: it.caption, createdAt: it.createdAt, likes: it.likes, media: [m] })
    else if (!out[i].media.some((x) => x.id === m.id))
      out[i] = { ...out[i], media: [...out[i].media, m].sort((a, b) => a.createdAt.localeCompare(b.createdAt)) }
  }
  return out
}

const read = () => { try { return JSON.parse(localStorage.getItem('liked') || '[]') } catch { return [] } }
export const hasLiked = (k) => read().includes(k)
export const setLiked = (k, on) => {
  try { const s = new Set(read()); on ? s.add(k) : s.delete(k); localStorage.setItem('liked', JSON.stringify([...s])) } catch {}
}
export async function sendLike(id, delta) {
  const r = await fetch('/api/like', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, delta }) })
  if (!r.ok) throw new Error('Like failed')
}

export const randomGuest = () => `Guest${Math.floor(1000 + Math.random() * 9000)}`
export const imgUrl = (id) => `https://lh3.googleusercontent.com/d/${id}=w900`
export const videoUrl = (id) => `https://drive.google.com/file/d/${id}/preview`

export function timeAgo(iso) {
  const s = Math.max(1, (Date.now() - new Date(iso)) / 1000)
  for (const [n, l] of [[86400, 'd'], [3600, 'h'], [60, 'm']]) if (s >= n) return `${Math.floor(s / n)}${l}`
  return 'now'
}
