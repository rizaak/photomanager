'use client'

import { use, useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Heart, ArrowDownToLine, Loader2, Check, RotateCcw, Lock } from 'lucide-react'
import { GalleryGrid, type GalleryLayout } from '@/components/gallery/GalleryGrid'
import type { Photo } from '@/lib/types'

// ── Presentation constants ─────────────────────────────────────────────────────

type CoverStyle = 'fullscreen' | 'split' | 'minimal'
type ColorTheme = 'dark' | 'light' | 'warm'

const THEMES: Record<ColorTheme, { bg: string; text: string; subtext: string; accent: string; border: string }> = {
  dark:  { bg: '#1C1917', text: '#d6d3d1', subtext: '#78716c', accent: '#C9A96E', border: 'rgba(255,255,255,0.06)' },
  light: { bg: '#F7F5F2', text: '#1c1917', subtext: '#78716c', accent: '#1c1917', border: 'rgba(0,0,0,0.08)'       },
  warm:  { bg: '#181210', text: '#d6c5b0', subtext: '#8c7560', accent: '#C9A96E', border: 'rgba(255,255,255,0.06)' },
}

type FinalsPhase = 'idle' | 'fetching' | 'done' | 'failed'
type PagePhase   = 'resolving' | 'password' | 'register' | 'loading' | 'ready' | 'error' | 'expired'

const HIDE_DELAY = 3800

const PLACEHOLDER_COLORS = [
  'bg-stone-700', 'bg-stone-600', 'bg-stone-800',
  'bg-stone-500', 'bg-stone-700', 'bg-stone-600',
]
function placeholderColor(id: string): string {
  const n = id.charCodeAt(0) + id.charCodeAt(id.length - 1)
  return PLACEHOLDER_COLORS[n % PLACEHOLDER_COLORS.length]
}

function storageKey(token: string) { return `ct_${token}` }

export default function ClientGalleryPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const searchParams = useSearchParams()
  const isPreview = searchParams.get('preview') === '1'

  // ── Access state ───────────────────────────────────────────────────────────
  const [phase,              setPhase]              = useState<PagePhase>('resolving')
  const [galleryId,          setGalleryId]          = useState<string | null>(null)
  const [galleryTitle,       setGalleryTitle]       = useState('')
  const [allowFinalDownload, setAllowFinalDownload] = useState(false)
  const [allowFavorites,     setAllowFavorites]     = useState(false)
  const [allowComments,      setAllowComments]      = useState(false)
  const [clientToken,        setClientToken]        = useState<string | undefined>(undefined)

  // ── Presentation state ─────────────────────────────────────────────────────
  const [gallerySubtitle,  setGallerySubtitle]  = useState<string | null>(null)
  const [galleryEventDate, setGalleryEventDate] = useState<string | null>(null)
  const [coverPhotoId,     setCoverPhotoId]     = useState<string | null>(null)
  const [coverStyle,       setCoverStyle]       = useState<CoverStyle>('fullscreen')
  const [galleryLayout,    setGalleryLayout]    = useState<GalleryLayout>('masonry')
  const [typographyStyle,  setTypographyStyle]  = useState('serif')
  const [colorTheme,       setColorTheme]       = useState<ColorTheme>('dark')

  // ── Password gate ──────────────────────────────────────────────────────────
  const [passwordInput,  setPasswordInput]  = useState('')
  const [passwordError,  setPasswordError]  = useState<string | null>(null)
  const [submittingPass, setSubmittingPass] = useState(false)
  const acceptedPassword = useRef<string | undefined>(undefined)

  // ── Client identity modal (lazy registration) ──────────────────────────────
  const [identityModal, setIdentityModal] = useState<{ pendingAction: (() => void) | null } | null>(null)

  // ── Registration gate ──────────────────────────────────────────────────────
  const [nameInput,     setNameInput]     = useState('')
  const [emailInput,    setEmailInput]    = useState('')
  const [regError,      setRegError]      = useState<string | null>(null)
  const [submittingReg, setSubmittingReg] = useState(false)

  // ── Gallery state ──────────────────────────────────────────────────────────
  const [photoSections, setPhotoSections] = useState<{ id: string; title: string; photos: Photo[] }[]>([])
  const [photos,        setPhotos]        = useState<Photo[]>([])
  const [favoritedIds,  setFavoritedIds]  = useState<Set<string>>(new Set())
  const [photoComments, setPhotoComments] = useState<Map<string, { id: string; body: string }>>(new Map())
  // activeTab: 'all' | 'favorites' | <sectionId>
  const [activeTab,     setActiveTab]     = useState('all')
  const [uiVisible,     setUiVisible]     = useState(true)
  const [finalsPhase,   setFinalsPhase]   = useState<FinalsPhase>('idle')

  const uiTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // ── Access resolution ──────────────────────────────────────────────────────
  const resolveAccess = useCallback(async (opts: {
    password?:    string
    clientToken?: string
    name?:        string
    email?:       string
  }) => {
    const res = await fetch(`/api/galleries/by-token/${token}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(isPreview ? { ...opts, preview: true } : opts),
    })

    const data = await res.json()

    if (res.ok) {
      if (data.clientToken) {
        localStorage.setItem(storageKey(token), data.clientToken)
        setClientToken(data.clientToken)
      }
      setGalleryId(data.id)
      setGalleryTitle(data.title)
      setAllowFinalDownload(!!data.allowFinalDownload)
      setAllowFavorites(!!data.allowFavorites)
      setAllowComments(!!data.allowComments)
      setGallerySubtitle(data.subtitle ?? null)
      setGalleryEventDate(data.eventDate ?? null)
      setCoverPhotoId(data.coverPhotoId ?? null)
      setCoverStyle((data.coverStyle ?? 'fullscreen') as CoverStyle)
      setGalleryLayout((data.galleryLayout ?? 'masonry') as GalleryLayout)
      setTypographyStyle(data.typographyStyle ?? 'serif')
      setColorTheme((data.colorTheme ?? 'dark') as ColorTheme)
      setPhase('loading')
      return
    }

    if (res.status === 401 && data.code === 'PASSWORD_REQUIRED') { setPhase('password'); return }
    if (res.status === 401 && data.code === 'WRONG_PASSWORD')    { setPasswordError('Incorrect access code. Try again.'); return }
    if (res.status === 403 && data.code === 'REGISTRATION_REQUIRED') { setPhase('register'); return }
    if (res.status === 410) { setPhase('expired'); return }
    setPhase('error')
  }, [token, isPreview])

  useEffect(() => {
    const stored = localStorage.getItem(storageKey(token))
    resolveAccess(stored ? { clientToken: stored } : {})
  }, [token, resolveAccess])

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!passwordInput.trim()) return
    setPasswordError(null)
    setSubmittingPass(true)
    acceptedPassword.current = passwordInput.trim()
    await resolveAccess({ password: passwordInput.trim() })
    setSubmittingPass(false)
  }

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nameInput.trim() || !emailInput.trim()) return
    setRegError(null)
    setSubmittingReg(true)
    const res = await resolveAccess({
      password: acceptedPassword.current,
      name:     nameInput.trim(),
      email:    emailInput.trim(),
    })
    if (phase === 'register') setRegError('Something went wrong. Please try again.')
    setSubmittingReg(false)
    return res
  }

  // ── Load gallery content ───────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'loading' || !galleryId) return

    const ct = clientToken ?? localStorage.getItem(storageKey(token)) ?? undefined
    const headers: Record<string, string> = ct ? { 'x-client-token': ct } : {}

    Promise.all([
      fetch(`/api/galleries/${galleryId}/photos`).then((r) => {
        if (!r.ok) throw new Error(`photos ${r.status}`)
        return r.json()
      }),
      ct
        ? fetch(`/api/galleries/${galleryId}/favorites`, { headers }).then((r) =>
            r.ok ? r.json() : { photoIds: [], comments: [] }
          )
        : Promise.resolve({ photoIds: [], comments: [] }),
    ])
      .then(([photosData, favoritesData]) => {
        // Build favorites set
        const favSet = new Set<string>(favoritesData.photoIds as string[])

        // Build comments map: photoId -> {id, body}
        const commMap = new Map<string, { id: string; body: string }>()
        for (const c of (favoritesData.comments ?? []) as { id: string; photoId: string; body: string }[]) {
          commMap.set(c.photoId, { id: c.id, body: c.body })
        }

        setFavoritedIds(favSet)
        setPhotoComments(commMap)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        function hydrate(p: any): Photo {
          return {
            ...p,
            status: 'ready',
            selected: false,
            favorited: false,
            placeholderColor: placeholderColor(p.id),
          }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sections = (photosData.sections ?? []).filter((s: any) => s.photos.length > 0)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setPhotoSections(sections.map((s: any) => ({ id: s.id, title: s.title, photos: s.photos.map(hydrate) })))
        if (sections.length > 0) setActiveTab(sections[0].id)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const allPhotos = [...sections.flatMap((s: any) => s.photos), ...(photosData.unsectioned ?? photosData.photos ?? [])]
        setPhotos(allPhotos.map(hydrate))
        setPhase('ready')
      })
      .catch(() => setPhase('error'))
  }, [phase, galleryId, clientToken, token])

  // ── Auto-hide chrome ───────────────────────────────────────────────────────
  const revealUi = useCallback(() => {
    setUiVisible(true)
    clearTimeout(uiTimer.current)
    uiTimer.current = setTimeout(() => setUiVisible(false), HIDE_DELAY)
  }, [])

  useEffect(() => {
    revealUi()
    window.addEventListener('mousemove',  revealUi)
    window.addEventListener('scroll',     revealUi, { passive: true })
    window.addEventListener('touchstart', revealUi, { passive: true })
    return () => {
      window.removeEventListener('mousemove',  revealUi)
      window.removeEventListener('scroll',     revealUi)
      window.removeEventListener('touchstart', revealUi)
      clearTimeout(uiTimer.current)
    }
  }, [revealUi])

  // Reset favorites tab when it becomes empty — fall back to first section or 'all'
  useEffect(() => {
    if (activeTab === 'favorites' && favoritedIds.size === 0) {
      setActiveTab(photoSections[0]?.id ?? 'all')
    }
  }, [favoritedIds.size, activeTab, photoSections])

  // ── Client helpers ─────────────────────────────────────────────────────────
  function clientHeaders(): Record<string, string> {
    const ct = clientToken ?? localStorage.getItem(storageKey(token)) ?? undefined
    return ct ? { 'x-client-token': ct } : {}
  }

  // ── Favorites ──────────────────────────────────────────────────────────────
  async function handleFavoriteToggle(photoId: string) {
    if (!galleryId || isPreview) return
    const ct = clientToken ?? localStorage.getItem(storageKey(token)) ?? undefined
    if (!ct) {
      setIdentityModal({ pendingAction: () => handleFavoriteToggle(photoId) })
      return
    }
    const wasFavorited = favoritedIds.has(photoId)

    // Optimistic update
    setFavoritedIds((prev) => {
      const next = new Set(prev)
      if (next.has(photoId)) next.delete(photoId); else next.add(photoId)
      return next
    })

    try {
      const res = await fetch(`/api/galleries/${galleryId}/favorites`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...clientHeaders() },
        body:    JSON.stringify({ photoId }),
      })
      if (!res.ok) {
        // Revert on failure
        setFavoritedIds((prev) => {
          const next = new Set(prev)
          if (wasFavorited) next.add(photoId); else next.delete(photoId)
          return next
        })
      }
    } catch {
      setFavoritedIds((prev) => {
        const next = new Set(prev)
        if (wasFavorited) next.add(photoId); else next.delete(photoId)
        return next
      })
    }
  }

  // ── Comments ───────────────────────────────────────────────────────────────
  async function handleAddComment(photoId: string, body: string) {
    if (!galleryId || isPreview) return
    const ct = clientToken ?? localStorage.getItem(storageKey(token)) ?? undefined
    if (!ct) {
      setIdentityModal({ pendingAction: () => handleAddComment(photoId, body) })
      return
    }
    const res = await fetch(`/api/galleries/${galleryId}/comments`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', ...clientHeaders() },
      body:    JSON.stringify({ body, photoId }),
    })
    if (res.ok) {
      const comment = await res.json()
      setPhotoComments((prev) => new Map(prev).set(photoId, { id: comment.id, body: comment.body }))
    }
  }

  async function handleUpdateComment(commentId: string, body: string, photoId: string) {
    if (!galleryId) return
    const res = await fetch(`/api/galleries/${galleryId}/comments/${commentId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json', ...clientHeaders() },
      body:    JSON.stringify({ body }),
    })
    if (res.ok) {
      const comment = await res.json()
      setPhotoComments((prev) => new Map(prev).set(photoId, { id: comment.id, body: comment.body }))
    }
  }

  async function handleDeleteComment(commentId: string, photoId: string) {
    if (!galleryId) return
    const res = await fetch(`/api/galleries/${galleryId}/comments/${commentId}`, {
      method:  'DELETE',
      headers: clientHeaders(),
    })
    if (res.ok) {
      setPhotoComments((prev) => {
        const next = new Map(prev)
        next.delete(photoId)
        return next
      })
    }
  }

  // ── Client identity ────────────────────────────────────────────────────────

  async function handleClientIdentified(newToken: string, pendingAction: (() => void) | null) {
    localStorage.setItem(storageKey(token), newToken)
    setClientToken(newToken)
    setIdentityModal(null)
    // Fetch favorites/comments for this client
    if (galleryId) {
      try {
        const res = await fetch(`/api/galleries/${galleryId}/favorites`, {
          headers: { 'x-client-token': newToken },
        })
        if (res.ok) {
          const data = await res.json()
          setFavoritedIds(new Set(data.photoIds as string[]))
          const commMap = new Map<string, { id: string; body: string }>()
          for (const c of (data.comments ?? []) as { id: string; photoId: string; body: string }[]) {
            commMap.set(c.photoId, { id: c.id, body: c.body })
          }
          setPhotoComments(commMap)
        }
      } catch { /* non-critical */ }
    }
    // Resume the original action (uses localStorage so stale closure is fine)
    pendingAction?.()
  }

  function handleClientLogout() {
    localStorage.removeItem(storageKey(token))
    setClientToken(undefined)
    setFavoritedIds(new Set())
    setPhotoComments(new Map())
  }

  // ── Finals download ────────────────────────────────────────────────────────
  async function handleDownloadFinals() {
    if (!galleryId || finalsPhase === 'fetching') return
    setFinalsPhase('fetching')
    try {
      const res = await fetch(`/api/galleries/${galleryId}/finals`, { headers: clientHeaders() })
      if (!res.ok) { setFinalsPhase('failed'); return }

      const data: { photos: { photoId: string; filename: string; url: string }[] } = await res.json()

      if (data.photos.length === 0) { setFinalsPhase('idle'); return }

      for (let i = 0; i < data.photos.length; i++) {
        const { url, filename } = data.photos[i]
        await new Promise<void>((resolve) => {
          setTimeout(() => {
            const a = document.createElement('a')
            a.href = url; a.download = filename; a.rel = 'noopener noreferrer'
            document.body.appendChild(a); a.click(); document.body.removeChild(a)
            resolve()
          }, i * 300)
        })
      }

      setFinalsPhase('done')
      setTimeout(() => setFinalsPhase('idle'), 3000)
    } catch { setFinalsPhase('failed') }
  }

  const chromeFade: React.CSSProperties = { opacity: uiVisible ? 1 : 0, transition: 'opacity 600ms ease' }

  // ── Spinner ────────────────────────────────────────────────────────────────
  if (phase === 'resolving' || phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1C1917' }}>
        <div className="w-5 h-5 rounded-full border border-stone-700 border-t-stone-500 animate-spin" />
      </div>
    )
  }

  // ── Password gate ──────────────────────────────────────────────────────────
  if (phase === 'password') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: '#1C1917' }}>
        <div className="w-full max-w-xs">
          <div className="flex justify-center mb-6">
            <Lock size={18} strokeWidth={1.5} className="text-stone-600" />
          </div>
          <p className="font-serif text-stone-400 text-center mb-6">This gallery is private</p>
          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            <input
              type="text"
              autoFocus
              autoComplete="off"
              value={passwordInput}
              onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(null) }}
              placeholder="Access code"
              className="w-full bg-transparent border border-stone-700 px-4 py-3 text-sm font-sans text-stone-200 placeholder-stone-700 focus:outline-none focus:border-stone-500 text-center tracking-widest"
            />
            {passwordError && (
              <p className="text-xs text-center font-sans text-red-500">{passwordError}</p>
            )}
            <button
              type="submit"
              disabled={submittingPass || !passwordInput.trim()}
              className="w-full py-3 text-sm font-sans transition-colors disabled:opacity-40"
              style={{ backgroundColor: 'rgba(201,169,110,0.12)', color: '#C9A96E', border: '1px solid rgba(201,169,110,0.25)' }}
            >
              {submittingPass ? 'Verifying…' : 'Enter gallery'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── Registration gate ──────────────────────────────────────────────────────
  if (phase === 'register') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: '#1C1917' }}>
        <div className="w-full max-w-xs">
          <p className="font-serif text-stone-300 text-center text-lg mb-1">Welcome</p>
          <p className="text-xs font-sans text-stone-600 text-center mb-8">
            Enter your name and email to view this gallery
          </p>
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            <input
              type="text"
              autoFocus
              autoComplete="name"
              value={nameInput}
              onChange={(e) => { setNameInput(e.target.value); setRegError(null) }}
              placeholder="Your name"
              className="w-full bg-transparent border border-stone-700 px-4 py-3 text-sm font-sans text-stone-200 placeholder-stone-700 focus:outline-none focus:border-stone-500"
            />
            <input
              type="email"
              autoComplete="email"
              value={emailInput}
              onChange={(e) => { setEmailInput(e.target.value); setRegError(null) }}
              placeholder="Email address"
              className="w-full bg-transparent border border-stone-700 px-4 py-3 text-sm font-sans text-stone-200 placeholder-stone-700 focus:outline-none focus:border-stone-500"
            />
            {regError && (
              <p className="text-xs text-center font-sans text-red-500">{regError}</p>
            )}
            <button
              type="submit"
              disabled={submittingReg || !nameInput.trim() || !emailInput.trim()}
              className="w-full py-3 text-sm font-sans transition-colors disabled:opacity-40"
              style={{ backgroundColor: 'rgba(201,169,110,0.12)', color: '#C9A96E', border: '1px solid rgba(201,169,110,0.25)' }}
            >
              {submittingReg ? 'Opening gallery…' : 'View gallery'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── Expired ────────────────────────────────────────────────────────────────
  if (phase === 'expired') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-2" style={{ backgroundColor: '#1C1917' }}>
        <p className="font-serif text-stone-500">This gallery is no longer available</p>
        <p className="font-sans text-xs text-stone-700">Please contact your photographer</p>
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (phase === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1C1917' }}>
        <p className="font-sans text-sm text-stone-600">Gallery not found</p>
      </div>
    )
  }

  // ── Empty ──────────────────────────────────────────────────────────────────
  if (photos.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-2" style={{ backgroundColor: '#1C1917' }}>
        <p className="font-serif text-stone-500">Photos are being processed</p>
        <p className="font-sans text-xs text-stone-700">Check back in a moment</p>
      </div>
    )
  }

  // ── Gallery ────────────────────────────────────────────────────────────────
  const theme    = THEMES[colorTheme]
  const favCount = favoritedIds.size

  // Resolve cover: use configured cover photo if found, otherwise first photo
  const coverPhoto    = coverPhotoId ? photos.find((p) => p.id === coverPhotoId) : null
  const coverPhotoUrl = (coverPhoto ?? photos[0])?.watermarkedUrl ?? null

  // ── Typography classes ─────────────────────────────────────────────────────
  const titleClass = typographyStyle === 'modern'
    ? 'font-sans font-light tracking-[0.2em] uppercase'
    : typographyStyle === 'minimal'
      ? 'font-sans font-medium tracking-[0.15em] uppercase text-sm'
      : 'font-serif'

  // ── Tab definitions ────────────────────────────────────────────────────────
  // Section tabs only — no "All" tab. Favorites is a virtual tab appended when non-empty.
  const tabs: { id: string; label: string; isHeart?: boolean }[] = [
    ...photoSections.map((s) => ({ id: s.id, label: s.title })),
    ...(allowFavorites && favCount > 0 ? [{ id: 'favorites', label: String(favCount), isHeart: true }] : []),
  ]
  // Hide tabs when there is only one thing to show (single section, no favorites tab yet)
  const showTabs = tabs.length > 1

  // ── Resolve photos for current tab ────────────────────────────────────────
  const allFlatPhotos = photos  // used as fallback when no sections exist

  const tabPhotos: Photo[] = (() => {
    if (activeTab === 'favorites') return allFlatPhotos.filter((p) => favoritedIds.has(p.id))
    const section = photoSections.find((s) => s.id === activeTab)
    if (section) return section.photos
    return allFlatPhotos   // no-section fallback
  })()

  const gridProps = {
    layout: galleryLayout,
    favoritedIds,
    photoComments,
    allowComments,
    onFavoriteToggle: allowFavorites ? handleFavoriteToggle                                                                  : undefined,
    onAddComment:     allowComments  ? (isPreview ? async (_: string, __: string) => {} : handleAddComment)                : undefined,
    onUpdateComment:  allowComments  ? (isPreview ? async (_: string, __: string, ___: string) => {} : handleUpdateComment) : undefined,
    onDeleteComment:  allowComments  ? (isPreview ? async (_: string, __: string) => {} : handleDeleteComment)             : undefined,
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: theme.bg, color: theme.text, userSelect: 'none', WebkitUserSelect: 'none' } as React.CSSProperties}
      onContextMenu={(e) => e.preventDefault()}
    >

      {/* ── Preview mode banner ────────────────────────────────────────────────── */}
      {isPreview && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-4 px-4 py-2 bg-stone-950/95 border-b border-stone-900 backdrop-blur-sm" style={{ pointerEvents: 'auto' }}>
          <div className="flex items-center gap-3 min-w-0">
            <span className="shrink-0 text-[10px] font-sans uppercase tracking-widest" style={{ color: '#C9A96E' }}>
              Preview
            </span>
            <span className="text-[11px] font-sans text-stone-500 truncate">
              This is how clients see your gallery · Favorites and comments are disabled
            </span>
          </div>
          <button
            onClick={() => window.close()}
            className="shrink-0 text-[11px] font-sans text-stone-600 hover:text-stone-400 transition-colors"
          >
            Close
          </button>
        </div>
      )}

      <header
        className="fixed top-0 left-0 right-0 z-30 px-6 pt-5 pb-14 pointer-events-none"
        style={{ background: `linear-gradient(to bottom, ${colorTheme === 'light' ? 'rgba(247,245,242,0.90)' : 'rgba(15,13,12,0.80)'} 0%, transparent 100%)`, ...chromeFade }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 className={`text-sm leading-snug ${titleClass}`} style={{ color: theme.subtext }}>{galleryTitle}</h1>
          </div>

          {/* Finals download */}
          {allowFinalDownload && (
            <div className="pointer-events-auto" style={{ opacity: uiVisible ? 1 : 0, transition: 'opacity 600ms ease' }}>
              <button
                onClick={finalsPhase === 'idle' || finalsPhase === 'failed' ? handleDownloadFinals : undefined}
                disabled={finalsPhase === 'fetching' || finalsPhase === 'done'}
                className="pt-px text-stone-500 hover:text-stone-300 disabled:pointer-events-none transition-colors duration-200"
                aria-label="Download final photos"
              >
                {finalsPhase === 'idle'     && <ArrowDownToLine size={14} strokeWidth={1.5} style={{ color: '#C9A96E' }} />}
                {finalsPhase === 'fetching' && <Loader2         size={14} strokeWidth={1.5} className="animate-spin" />}
                {finalsPhase === 'done'     && <Check           size={14} strokeWidth={1.5} style={{ color: '#C9A96E' }} />}
                {finalsPhase === 'failed'   && <RotateCcw       size={14} strokeWidth={1.5} style={{ color: '#ef4444' }} />}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Push content below preview banner */}
      {isPreview && <div className="h-[38px]" />}

      {/* ── Cover section ─────────────────────────────────────────────────────── */}
      <GalleryCover
        style={coverStyle}
        title={galleryTitle}
        subtitle={gallerySubtitle}
        eventDate={galleryEventDate}
        coverUrl={coverPhotoUrl}
        theme={theme}
        titleClass={titleClass}
      />

      {/* ── Section / filter tabs ──────────────────────────────────────────────── */}
      {showTabs && (
        <div
          className="overflow-x-auto px-3 pb-4 pt-3"
          style={{ scrollbarWidth: 'none' }}
        >
          <div className="flex gap-2 min-w-max">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-sans transition-all duration-200"
                  style={{
                    backgroundColor: isActive
                      ? 'rgba(201,169,110,0.15)'
                      : colorTheme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
                    color: isActive ? '#C9A96E' : theme.subtext,
                    border: isActive ? '1px solid rgba(201,169,110,0.3)' : '1px solid transparent',
                  }}
                  aria-pressed={isActive}
                >
                  {tab.isHeart && (
                    <Heart
                      size={10}
                      strokeWidth={0}
                      style={{ fill: isActive ? '#C9A96E' : 'rgba(201,169,110,0.6)', flexShrink: 0 }}
                    />
                  )}
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Photo grid ────────────────────────────────────────────────────────── */}
      <div className="p-1">
        {tabPhotos.length > 0 ? (
          <GalleryGrid photos={tabPhotos} {...gridProps} />
        ) : (
          <div className="flex flex-col items-center justify-center py-24 gap-2">
            <Heart size={20} strokeWidth={1.25} style={{ color: 'rgba(201,169,110,0.3)' }} />
            <p className="font-sans text-xs" style={{ color: theme.subtext, opacity: 0.5 }}>
              {activeTab === 'favorites' ? 'No favourites yet' : 'No photos in this section'}
            </p>
          </div>
        )}
      </div>

      <div className="h-16" />

      {/* ── Switch client ──────────────────────────────────────────────────────── */}
      {clientToken && !isPreview && (
        <div
          className="fixed bottom-5 right-5 z-30 pointer-events-auto"
          style={chromeFade}
        >
          <button
            onClick={handleClientLogout}
            className="text-[11px] font-sans transition-colors"
            style={{ color: theme.subtext }}
            onMouseEnter={(e) => (e.currentTarget.style.color = theme.text)}
            onMouseLeave={(e) => (e.currentTarget.style.color = theme.subtext)}
          >
            Switch client
          </button>
        </div>
      )}

      {/* ── Client identity modal ──────────────────────────────────────────────── */}
      {identityModal && !isPreview && (
        <ClientIdentityModal
          token={token}
          acceptedPassword={acceptedPassword.current}
          theme={theme}
          onClose={() => setIdentityModal(null)}
          onSuccess={(newToken) => handleClientIdentified(newToken, identityModal.pendingAction)}
        />
      )}
    </div>
  )
}

// ── ClientIdentityModal ────────────────────────────────────────────────────────

function ClientIdentityModal({
  token,
  acceptedPassword,
  theme,
  onClose,
  onSuccess,
}: {
  token:           string
  acceptedPassword: string | undefined
  theme:           typeof THEMES[ColorTheme]
  onClose:         () => void
  onSuccess:       (clientToken: string) => void
}) {
  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [error,   setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [loading, onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const n = name.trim(); const em = email.trim()
    if (!n || !em || loading) return
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/galleries/by-token/${token}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: n, email: em, ...(acceptedPassword ? { password: acceptedPassword } : {}) }),
      })
      const data = await res.json()
      if (res.ok && data.clientToken) {
        onSuccess(data.clientToken)
      } else if (res.ok) {
        // Gallery doesn't require client info — clientToken absent, use registration flag
        setError('Could not register. Please try again.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full bg-transparent border px-4 py-3 text-sm font-sans placeholder-stone-700 focus:outline-none transition-colors'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
        onClick={!loading ? onClose : undefined}
      />
      <div
        className="relative w-full max-w-xs pb-2"
        style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}` }}
      >
        <div className="px-6 pt-6 pb-5">
          <p className="font-serif text-base mb-1" style={{ color: theme.text }}>
            Tell us who you are
          </p>
          <p className="text-[11px] font-sans leading-relaxed mb-5" style={{ color: theme.subtext }}>
            Your name and email let us save your favorites and comments.
            If you&rsquo;ve visited before, use the same email to restore them.
          </p>
          <form onSubmit={handleSubmit} className="space-y-2.5">
            <input
              autoFocus
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(null) }}
              placeholder="Your name"
              className={inputCls}
              style={{ color: theme.text, borderColor: theme.border }}
            />
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null) }}
              placeholder="Email address"
              className={inputCls}
              style={{ color: theme.text, borderColor: theme.border }}
            />
            {error && (
              <p className="text-xs font-sans text-red-400 pt-0.5">{error}</p>
            )}
            <button
              type="submit"
              disabled={!name.trim() || !email.trim() || loading}
              className="w-full py-3 text-sm font-sans transition-colors disabled:opacity-40 mt-1"
              style={{ backgroundColor: 'rgba(201,169,110,0.12)', color: '#C9A96E', border: '1px solid rgba(201,169,110,0.25)' }}
            >
              {loading ? 'Saving…' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

// ── GalleryCover ──────────────────────────────────────────────────────────────

function GalleryCover({
  style,
  title,
  subtitle,
  eventDate,
  coverUrl,
  theme,
  titleClass,
}: {
  style:      CoverStyle
  title:      string
  subtitle:   string | null
  eventDate:  string | null
  coverUrl:   string | null
  theme:      typeof THEMES[ColorTheme]
  titleClass: string
}) {
  const formattedDate = eventDate
    ? new Date(eventDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  if (style === 'fullscreen' && coverUrl) {
    return (
      <div className="relative w-full" style={{ height: '100vh' }}>
        <img
          src={coverUrl}
          alt=""
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ userSelect: 'none', WebkitUserSelect: 'none', pointerEvents: 'none', WebkitUserDrag: 'none' } as React.CSSProperties}
        />
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(to top, ${theme.bg} 0%, transparent 50%)` }}
        />
        <div className="absolute bottom-0 left-0 right-0 px-8 pb-10">
          <h1 className={`text-3xl mb-1.5 ${titleClass}`} style={{ color: theme.text }}>{title}</h1>
          {subtitle && (
            <p className="font-sans text-sm" style={{ color: theme.subtext }}>{subtitle}</p>
          )}
          {formattedDate && (
            <p className="font-sans text-xs mt-1 tracking-wider" style={{ color: theme.subtext }}>{formattedDate}</p>
          )}
        </div>
      </div>
    )
  }

  if (style === 'split') {
    return (
      <div className="w-full pt-20 pb-8 px-8 flex items-center gap-10 min-h-[50vh]">
        <div className="flex-1 max-w-xs">
          <h1 className={`text-3xl mb-3 ${titleClass}`} style={{ color: theme.text }}>{title}</h1>
          {subtitle && (
            <p className="font-sans text-sm leading-relaxed mb-3" style={{ color: theme.subtext }}>{subtitle}</p>
          )}
          {formattedDate && (
            <p className="font-sans text-xs tracking-wider" style={{ color: theme.subtext }}>{formattedDate}</p>
          )}
        </div>
        {coverUrl && (
          <div className="flex-1 max-w-md aspect-[4/3] overflow-hidden">
            <img
              src={coverUrl}
              alt=""
              draggable={false}
              className="w-full h-full object-cover"
              style={{ userSelect: 'none', WebkitUserSelect: 'none', pointerEvents: 'none', WebkitUserDrag: 'none' } as React.CSSProperties}
            />
          </div>
        )}
      </div>
    )
  }

  // minimal — text only, centered
  return (
    <div className="flex flex-col items-center justify-center pt-28 pb-12 px-8 text-center">
      <h1 className={`text-3xl mb-2 ${titleClass}`} style={{ color: theme.text }}>{title}</h1>
      {subtitle && (
        <p className="font-sans text-sm leading-relaxed max-w-xs" style={{ color: theme.subtext }}>{subtitle}</p>
      )}
      {formattedDate && (
        <p className="font-sans text-xs mt-2 tracking-wider" style={{ color: theme.subtext }}>{formattedDate}</p>
      )}
    </div>
  )
}
