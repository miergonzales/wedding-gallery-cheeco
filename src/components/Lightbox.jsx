import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { imgUrl, videoUrl } from '../lib/api'

export default function Lightbox({ media, start, guest, onClose }) {
  const [i, setI] = useState(start)
  const n = media.length
  const go = useCallback((d) => setI((x) => (x + d + n) % n), [n])

  useEffect(() => {
    const k = (e) => (e.key === 'Escape' ? onClose() : e.key === 'ArrowRight' ? go(1) : e.key === 'ArrowLeft' ? go(-1) : null)
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [go, onClose])

  const m = media[i]
  const stop = (e) => e.stopPropagation()

  return createPortal(
    <motion.div className="fixed inset-0 z-[60] bg-black/95 grid place-items-center" onClick={onClose}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <p className="absolute top-4 left-4 text-white text-sm">Shared by {guest}{n > 1 && `, ${i + 1} of ${n}`}</p>
      <button onClick={onClose} aria-label="Close" className="absolute top-3 right-3 text-white p-2"><X size={26} /></button>

      {n > 1 && (
        <>
          <button onClick={(e) => { stop(e); go(-1) }} aria-label="Previous" className="absolute left-2 text-white bg-black/40 rounded-full p-2"><ChevronLeft size={26} /></button>
          <button onClick={(e) => { stop(e); go(1) }} aria-label="Next" className="absolute right-2 text-white bg-black/40 rounded-full p-2"><ChevronRight size={26} /></button>
        </>
      )}

      {m.type === 'video' ? (
        <iframe key={m.id} src={videoUrl(m.id)} title={guest} allow="autoplay; fullscreen" onClick={stop}
          className="w-[88vw] max-w-md h-[78dvh] border-0 rounded-lg" />
      ) : (
        <motion.img key={m.id} src={m.localUrl || imgUrl(m.id)} alt={`Photo by ${guest}`} onClick={stop}
          drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.4}
          onDragEnd={(_, { offset }) => n > 1 && (offset.x < -60 ? go(1) : offset.x > 60 ? go(-1) : null)}
          className="max-w-[92vw] max-h-[82dvh] object-contain select-none" draggable={false} />
      )}
    </motion.div>,
    document.body
  )
}
