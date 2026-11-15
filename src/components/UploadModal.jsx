import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { X, ImagePlus } from 'lucide-react'
import { uploadFile, randomGuest, markDone } from '../lib/api'

export default function UploadModal({ onClose, onDone }) {
  const [files, setFiles] = useState([]) // {file, url, progress, error}
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const input = useRef()
  const [caption, setCaption] = useState('')
  const batch = useRef(crypto.randomUUID())
  const guestRef = useRef(null)

  useEffect(() => () => files.forEach((f) => URL.revokeObjectURL(f.url)), []) // eslint-disable-line

  const add = (list) =>
    setFiles((p) => [...p, ...[...list].map((file) => ({ file, url: URL.createObjectURL(file), progress: 0 }))])
  const patch = (i, o) => setFiles((p) => p.map((f, k) => (k === i ? { ...f, ...o } : f)))

  async function submit() {
    setBusy(true)
    const guest = guestRef.current || (guestRef.current = name.trim() || randomGuest())
    const meta = { guest, caption: caption.trim(), batch: batch.current }
    const posted = []
    let failed = 0
    for (let i = 0; i < files.length; i++) {
      if (files[i].progress === 1) continue // already uploaded on a previous try
      patch(i, { error: undefined })
      try {
        const { id } = await uploadFile(files[i].file, meta, (p) => patch(i, { progress: p }))
        patch(i, { progress: 1 })
        posted.push({
          id, ...meta, key: meta.batch, likes: 0, createdAt: new Date().toISOString(),
          type: files[i].file.type.startsWith('video') ? 'video' : 'image',
          localUrl: files[i].file.type.startsWith('image') ? files[i].url : undefined,
        })
      } catch (e) {
        failed++; patch(i, { error: e.message, progress: 0 })
      }
    }
    setBusy(false)
    if (posted.length) { markDone(posted.length); onDone(posted) }
    if (!failed) onClose()
  }

  return (
    <motion.div className="fixed inset-0 z-50 bg-black/60 grid place-items-end sm:place-items-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !busy && onClose()}>
      <motion.div onClick={(e) => e.stopPropagation()}
        initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[92dvh] flex flex-col pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
          <button onClick={onClose} disabled={busy} aria-label="Close"><X size={22} /></button>
          <h2 className="font-semibold">New post</h2>
          <button onClick={submit} disabled={!files.length || busy}
            className="text-[#0095f6] font-semibold disabled:opacity-40">{busy ? 'Sharing…' : 'Share'}</button>
        </div>

        <div className="overflow-y-auto p-4 space-y-4">
          <input ref={input} type="file" hidden multiple accept="image/*,video/*" onChange={(e) => { add(e.target.files); e.target.value = '' }} />

          <div className="grid grid-cols-3 gap-2">
            {files.map((f, i) => (
              <div key={f.url} className="relative aspect-square bg-neutral-100 rounded-md overflow-hidden">
                {f.file.type.startsWith('video')
                  ? <video src={f.url} muted playsInline className="w-full h-full object-cover" />
                  : <img src={f.url} alt="" className="w-full h-full object-cover" />}
                {!busy && f.progress === 0 && (
                  <button onClick={() => setFiles((p) => p.filter((_, k) => k !== i))} aria-label="Remove"
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"><X size={14} /></button>
                )}
                {(busy || f.progress > 0 || f.error) && (
                  <div className="absolute inset-x-0 bottom-0 bg-black/50 p-1.5">
                    {f.error
                      ? <p className="text-[10px] text-red-300 leading-tight">{f.error}</p>
                      : <div className="h-1 bg-white/30 rounded"><motion.div className="h-full bg-[#0095f6] rounded" animate={{ width: `${f.progress * 100}%` }} /></div>}
                  </div>
                )}
              </div>
            ))}
            {!busy && (
              <button onClick={() => input.current.click()}
                className="aspect-square rounded-md border-2 border-dashed border-neutral-300 grid place-items-center text-neutral-500 hover:bg-neutral-50">
                <span className="flex flex-col items-center gap-1 text-xs"><ImagePlus size={24} />Add photos or videos</span>
              </button>
            )}
          </div>

          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={30} disabled={busy}
            placeholder="Your name (optional)"
            className="w-full border border-neutral-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-neutral-500" />
          <textarea value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={200} rows={2} disabled={busy}
            placeholder="Say something about your photos (optional)"
            className="w-full border border-neutral-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-neutral-500 resize-none" />
        </div>
      </motion.div>
    </motion.div>
  )
}
