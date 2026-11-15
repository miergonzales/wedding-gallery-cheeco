import { getToken } from './_google.js'

// Creates a Drive "resumable upload" session. The browser then uploads the file
// straight to Google (real progress, no size limit from this server).
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const { name, mimeType, size, guest, caption, batch } = req.body || {}
    if (!/^(image|video)\//.test(mimeType || '')) return res.status(400).json({ error: 'Only photos and videos are allowed' })

    const headers = {
      Authorization: `Bearer ${await getToken()}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': mimeType,
      'X-Upload-Content-Length': String(size),
    }
    if (req.headers.origin) headers.Origin = req.headers.origin // enables CORS on the upload URL

    const r = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: `${Date.now()}-${String(name).slice(0, 80)}`,
        parents: [process.env.DRIVE_FOLDER_ID],
        description: String(caption || '').slice(0, 200), // Drive limits each custom property to 124 bytes, so the caption goes in description
        appProperties: { guest: String(guest || 'Guest').slice(0, 30), batch: String(batch || '').slice(0, 40) },
      }),
    })
    const url = r.headers.get('location')
    if (!url) return res.status(500).json({ error: 'Drive refused the upload' })
    res.json({ url })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
