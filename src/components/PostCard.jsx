import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Play } from 'lucide-react'
import Lightbox from './Lightbox'
import { imgUrl, timeAgo, hasLiked, setLiked, sendLike } from '../lib/api'

const SHOW = 4
const thumb = (m) => m.localUrl || (m.type === 'video' ? `https://drive.google.com/thumbnail?id=${m.id}&sz=w600` : imgUrl(m.id))
const LAYOUT = { 1: 'grid-cols-1 grid-rows-1', 2: 'grid-cols-2 grid-rows-1', 3: 'grid-cols-2 grid-rows-2', 4: 'grid-cols-2 grid-rows-2' }

export default function PostCard({ post }) {
  const [liked, setL] = useState(() => hasLiked(post.key))
  const [count, setCount] = useState(post.likes || 0)
  const [pop, setPop] = useState(0)
  const [openAt, setOpenAt] = useState(null)
  const lastTap = useRef(0)
  const timer = useRef()

  const shown = post.media.slice(0, SHOW)
  const extra = post.media.length - SHOW

  async function toggle(next) {
    if (next === liked) return
    const apply = (on) => { setL(on); setLiked(post.key, on); setCount((c) => Math.max(0, c + (on ? 1 : -1))) }
    apply(next)
    try { await sendLike(post.key, next ? 1 : -1) } catch { apply(!next) }
  }

  // single tap opens the viewer, double tap likes
  const tap = (i) => {
    const now = Date.now()
    if (now - lastTap.current < 320) {
      clearTimeout(timer.current); lastTap.current = 0
      setPop((p) => p + 1); toggle(true)
    } else {
      lastTap.current = now
      timer.current = setTimeout(() => setOpenAt(i), 320)
    }
  }

  return (
    <article className="w-full max-w-[470px] bg-white border border-neutral-200 rounded-lg overflow-hidden">
      <header className="flex items-center gap-3 px-3 py-2.5">
        <div className="ig-ring p-[2px] rounded-full">
          <div className="w-8 h-8 rounded-full bg-white grid place-items-center text-sm font-semibold border-2 border-white">
            {post.guest.charAt(0).toUpperCase()}
          </div>
        </div>
        <span className="text-sm font-semibold truncate">{post.guest}</span>
        <span className="text-xs text-neutral-400 ml-auto">{timeAgo(post.createdAt)}</span>
      </header>

      <div className="relative aspect-[4/5] bg-neutral-100">
        <div className={`grid gap-0.5 h-full ${LAYOUT[shown.length]}`} style={{ touchAction: 'manipulation' }}>
          {shown.map((m, i) => (
            <button key={m.id} onClick={() => tap(i)} aria-label={`Open ${m.type} ${i + 1}`}
              className={`relative overflow-hidden bg-neutral-200 ${shown.length === 3 && i === 0 ? 'row-span-2' : ''}`}>
              <img src={thumb(m)} alt="" loading="lazy" draggable={false} className="absolute inset-0 w-full h-full object-cover select-none" />
              {m.type === 'video' && <Play size={30} className="absolute inset-0 m-auto fill-white text-white drop-shadow" />}
              {i === SHOW - 1 && extra > 0 && (
                <span className="absolute inset-0 bg-black/55 text-white text-2xl font-semibold grid place-items-center">+{extra}</span>
              )}
            </button>
          ))}
        </div>

        {pop > 0 && (
          <motion.div key={pop} className="absolute inset-0 grid place-items-center pointer-events-none"
            initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: [0, 1, 1, 0], scale: [0.4, 1.2, 1, 1] }} transition={{ duration: 0.8 }}>
            <Heart size={88} className="fill-white text-white drop-shadow-lg" />
          </motion.div>
        )}
      </div>

      <footer className="px-3 py-2.5 space-y-1">
        <motion.button whileTap={{ scale: 0.8 }} onClick={() => toggle(!liked)} aria-label={liked ? 'Unlike' : 'Like'}>
          <Heart className={liked ? 'fill-red-500 text-red-500' : ''} size={26} strokeWidth={1.8} />
        </motion.button>
        <p className="text-sm font-semibold">{count} {count === 1 ? 'like' : 'likes'}</p>
        {post.caption && <p className="text-sm break-words"><span className="font-semibold">{post.guest}</span> {post.caption}</p>}
      </footer>

      {openAt !== null && <Lightbox media={post.media} start={openAt} guest={post.guest} onClose={() => setOpenAt(null)} />}
    </article>
  )
}
