import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { imgUrl, videoUrl, timeAgo, hasLiked, setLiked, sendLike } from '../lib/api'

export default function PostCard({ post }) {
  const [liked, setL] = useState(() => hasLiked(post.key))
  const [count, setCount] = useState(post.likes || 0)
  const [pop, setPop] = useState(0)
  const [idx, setIdx] = useState(0)
  const lastTap = useRef(0)
  const n = post.media.length

  async function toggle(next) {
    if (next === liked) return
    const apply = (on) => { setL(on); setLiked(post.key, on); setCount((c) => Math.max(0, c + (on ? 1 : -1))) }
    apply(next)
    try { await sendLike(post.key, next ? 1 : -1) } catch { apply(!next) }
  }

  const tap = () => {
    const now = Date.now()
    if (now - lastTap.current < 320) { setPop((p) => p + 1); toggle(true) } // double-tap = like
    lastTap.current = now
  }

  return (
    <article className="snap-center shrink-0 w-[86vw] max-w-[390px] bg-white border border-neutral-200 rounded-lg overflow-hidden self-start">
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
        <div className="flex h-full overflow-x-auto snap-x snap-mandatory no-scrollbar"
          onScroll={(e) => setIdx(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}>
          {post.media.map((m) => (
            <div key={m.id} className="w-full h-full shrink-0 snap-center" onClick={m.type === 'image' ? tap : undefined} style={{ touchAction: 'manipulation' }}>
              {m.type === 'video'
                ? <iframe src={videoUrl(m.id)} title={post.guest} allow="autoplay; fullscreen" className="w-full h-full border-0" />
                : <img src={m.localUrl || imgUrl(m.id)} alt={`Photo by ${post.guest}`} loading="lazy" draggable={false} className="w-full h-full object-cover select-none" />}
            </div>
          ))}
        </div>

        {n > 1 && <span className="absolute top-2 right-2 bg-black/60 text-white text-xs rounded-full px-2 py-0.5">{idx + 1}/{n}</span>}
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
    </article>
  )
}
