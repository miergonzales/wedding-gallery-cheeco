import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import PostCard from './components/PostCard'
import UploadModal from './components/UploadModal'
import { fetchPage, mergeGroups } from './lib/api'

const TITLE = 'Cherry & Jerico'
const DATE = '12 | 04 | 2026'
const COVER = import.meta.env.VITE_COVER_URL

export default function App() {
  const [posts, setPosts] = useState([])
  const [next, setNext] = useState(undefined) // undefined = first page pending, null = end of feed
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState(false)
  const scroller = useRef()
  const sentinel = useRef()

  const load = useCallback(async () => {
    if (loading || next === null) return
    setLoading(true); setError('')
    try {
      const d = await fetchPage(next)
      setPosts((p) => mergeGroups(p, d.items))
      if (next === undefined) setTotal(d.total)
      setNext(d.next)
    } catch (e) { setError(e.message) }
    setLoading(false)
  }, [loading, next])

  // infinite horizontal loading: fetch the next page when the end-of-feed sentinel nears the viewport
  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && !error && load(), { root: scroller.current, rootMargin: '0px 0px 800px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [load, error])

  function onDone(items) {
    const g = { key: items[0].key, guest: items[0].guest, caption: items[0].caption, createdAt: items[0].createdAt, likes: 0,
      media: items.map(({ id, type, createdAt, localUrl }) => ({ id, type, createdAt, localUrl })) }
    setPosts((p) => {
      const i = p.findIndex((x) => x.key === g.key)
      if (i < 0) return [g, ...p]
      const c = [...p]; c[i] = { ...c[i], media: [...c[i].media, ...g.media] }; return c
    })
    setTotal((t) => t + items.length)
    scroller.current?.scrollTo({ top: 0, behavior: 'smooth' })
    setToast(true); setTimeout(() => setToast(false), 3500)
  }

  return (
    <div className="h-dvh flex flex-col">
      <header className="flex items-center justify-between px-4 h-14 bg-white border-b border-neutral-200 shrink-0">
        <div className="flex items-center gap-2"><img src="/favicon.png" alt="" className="w-8 h-8 object-contain" /><span className="text-xl font-semibold tracking-tight">Guest Gallery</span></div>
        <motion.button whileTap={{ scale: 0.92 }} onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 bg-[#0095f6] hover:bg-[#1877f2] text-white text-sm font-semibold rounded-lg px-3.5 py-1.5">
          <Plus size={18} /> Post
        </motion.button>
      </header>


      <main ref={scroller} className="flex-1 overflow-y-auto">
      <section className="relative h-[70dvh] lg:h-[60dvh] flex items-end justify-center pb-10 sm:pb-14 text-center text-white"
          style={{ background: COVER ? `center / cover url(${COVER})` : 'linear-gradient(135deg,#1e3a5f,#4a6fa5 55%,#9db7d9)' }}>
          {/* vignette: dark edges + a soft dark centre so the text stays readable on any photo */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,.55), transparent 55%), radial-gradient(ellipse at center, rgba(0,0,0,.42) 0%, rgba(0,0,0,.3) 45%, rgba(0,0,0,.8) 100%)' }} />
          <div className="relative px-4" style={{ textShadow: '0 2px 12px rgba(0,0,0,.6)' }}>
            <h1 className="font-script text-6xl sm:text-8xl leading-tight">{TITLE}</h1>
            <p className="mt-3 text-base sm:text-lg tracking-[0.35em]">{DATE}</p>
            <p className="mt-4 text-sm sm:text-base">{total} {total === 1 ? 'photo or video' : 'photos & videos'} collected</p>
          </div>
        </section>
        <div className="flex flex-col items-center gap-5 px-3 py-5">
        {posts.map((p) => <PostCard key={p.key} post={p} />)}

        {next === null && posts.length === 0 && (
          <div className="my-12 text-center text-neutral-500">
            <p className="font-semibold text-neutral-800">No posts yet</p>
            <p className="text-sm mt-1">{import.meta.env.VITE_EVENT_SUBTITLE || 'Be the first to share a moment.'}</p>
          </div>
        )}

        {loading && [0, 1].map((i) => (
          <div key={i} className="w-full max-w-[470px] bg-white border border-neutral-200 rounded-lg animate-pulse">
            <div className="h-14" /><div className="aspect-[4/5] bg-neutral-100" /><div className="h-16" />
          </div>
        ))}

        {error && <button onClick={load} className="shrink-0 self-center text-sm text-[#0095f6] font-semibold px-4">{error}. Tap to retry</button>}
        <div ref={sentinel} className="w-full h-px" />
        </div>
      </main>

      <AnimatePresence>
        {open && <UploadModal onClose={() => setOpen(false)} onDone={onDone} />}
        {toast && (
          <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            className="fixed bottom-6 inset-x-4 mx-auto max-w-xs z-50 bg-neutral-900 text-white text-sm text-center rounded-xl px-4 py-3 shadow-lg">
            Thank you for sharing!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
