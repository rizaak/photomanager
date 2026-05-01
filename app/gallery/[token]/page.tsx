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
type FavFilter   = 'all' | 'favorites'

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
  const [allowDownload,      setAllowDownload]      = useState(false)
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
  const [favFilter,     setFavFilter]     = useState<FavFilter>('all')
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
      setAllowDownload(data.allowDownload)
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

  // ── Client helpers ─────────────────────────────────────────────────────────
  function clientHeaders(): Record<string, string> {
    const ct = clientToken ?? localStorage.getItem(storageKey(token)) ?? undefined
    return ct ? { 'x-client-token': ct } : {}
  }

  // ── Favorites ──────────────────────────────────────────────────────────────
  async function handleFavoriteToggle(photoId: string) {
    if (!galleryId) return
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
    if (!galleryId) return
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
  const theme        = THEMES[colorTheme]
  const favCount     = favoritedIds.size
  const showFavBadge = allowFavorites && favCount > 0

  // Find cover photo watermarked URL from the loaded photo list
  const coverPhotoUrl = coverPhotoId
    ? photos.find((p) => p.id === coverPhotoId)?.watermarkedUrl ?? null
    : null

  // ── Typography classes ─────────────────────────────────────────────────────
  const titleClass = typographyStyle === 'modern'
    ? 'font-sans font-light tracking-[0.2em] uppercase'
    : typographyStyle === 'minimal'
      ? 'font-sans font-medium tracking-[0.15em] uppercase text-sm'
      : 'font-serif'

  // ── Filter photos ──────────────────────────────────────────────────────────
  const filterPhotos = (list: Photo[]) =>
    favFilter === 'favorites' ? list.filter((p) => favoritedIds.has(p.id)) : list

  const filteredSections = photoSections
    .map((s) => ({ ...s, photos: filterPhotos(s.photos) }))
    .filter((s) => s.photos.length > 0)

  const unsectioned = photos.filter(
    (p) => !photoSections.some((s) => s.photos.find((sp) => sp.id === p.id))
  )
  const filteredUnsectioned = filterPhotos(unsectioned)

  const gridProps = {
    layout: galleryLayout,
    favoritedIds,
    photoComments,
    allowComments,
    onFavoriteToggle: allowFavorites ? handleFavoriteToggle : undefined,
    onAddComment:     allowComments  ? handleAddComment     : undefined,
    onUpdateComment:  allowComments  ? handleUpdateComment  : undefined,
    onDeleteComment:  allowComments  ? handleDeleteComment  : undefined,
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: theme.bg, color: theme.text, userSelect: 'none', WebkitUserSelect: 'none' } as React.CSSProperties}
      onContextMenu={(e) => e.preventDefault()}
    >

      <header
        className="fixed top-0 left-0 right-0 z-30 px-6 pt-5 pb-14 pointer-events-none"
        style={{ background: `linear-gradient(to bottom, ${colorTheme === 'light' ? 'rgba(247,245,242,0.90)' : 'rgba(15,13,12,0.80)'} 0%, transparent 100%)`, ...chromeFade }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 className={`text-sm leading-snug ${titleClass}`} style={{ color: theme.subtext }}>{galleryTitle}</h1>
          </div>

          <div className="flex items-center gap-3 pointer-events-auto">
            {/* Favorite count + filter toggle */}
            {showFavBadge && (
              <button
                onClick={() => setFavFilter((f) => f === 'all' ? 'favorites' : 'all')}
                className="flex items-center gap-1.5 transition-opacity duration-200"
                aria-label={favFilter === 'favorites' ? 'Show all photos' : 'Show favourites only'}
                style={{ opacity: uiVisible ? 1 : 0, transition: 'opacity 600ms ease' }}
              >
                <Heart
                  size={12}
                  strokeWidth={0}
                  style={{
                    fill: favFilter === 'favorites' ? '#C9A96E' : 'rgba(201,169,110,0.5)',
                    transition: 'fill 300ms ease',
                  }}
                />
                <span
                  className="text-xs font-sans tabular-nums"
                  style={{ color: favFilter === 'favorites' ? '#C9A96E' : 'rgba(201,169,110,0.5)' }}
                >
                  {favCount}
                </span>
              </button>
            )}

            {/* Finals download */}
            {allowFinalDownload && (
              <button
                onClick={finalsPhase === 'idle' || finalsPhase === 'failed' ? handleDownloadFinals : undefined}
                disabled={finalsPhase === 'fetching' || finalsPhase === 'done'}
                className="pt-px text-stone-500 hover:text-stone-300 disabled:pointer-events-none transition-colors duration-200"
                aria-label="Download final photos"
                style={{ opacity: uiVisible ? 1 : 0, transition: 'opacity 600ms ease' }}
              >
                {finalsPhase === 'idle'     && <ArrowDownToLine size={14} strokeWidth={1.5} style={{ color: '#C9A96E' }} />}
                {finalsPhase === 'fetching' && <Loader2         size={14} strokeWidth={1.5} className="animate-spin" />}
                {finalsPhase === 'done'     && <Check           size={14} strokeWidth={1.5} style={{ color: '#C9A96E' }} />}
                {finalsPhase === 'failed'   && <RotateCcw       size={14} strokeWidth={1.5} style={{ color: '#ef4444' }} />}
              </button>
            )}
          </div>
        </div>
      </header>

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

      {/* ── Photo grid ────────────────────────────────────────────────────────── */}
      <div className={coverStyle === 'minimal' ? 'p-1' : 'p-1 pt-4'}>
        {photoSections.length > 0 ? (
          <>
            {filteredSections.map((section) => (
              <div key={section.id} className="mb-8">
                <div className="px-2 pb-3">
                  <p className="text-xs font-sans tracking-widest uppercase" style={{ color: 'rgba(168,163,158,0.55)' }}>
                    {section.title}
                  </p>
                </div>
                <GalleryGrid photos={section.photos} {...gridProps} />
              </div>
            ))}
            {filteredUnsectioned.length > 0 && (
              <div className="mt-4">
                <GalleryGrid photos={filteredUnsectioned} {...gridProps} />
              </div>
            )}
            {/* Empty state for favorites filter */}
            {favFilter === 'favorites' && filteredSections.length === 0 && filteredUnsectioned.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 gap-2">
                <Heart size={20} strokeWidth={1.25} style={{ color: 'rgba(201,169,110,0.3)' }} />
                <p className="font-sans text-xs text-stone-700">No favourites yet</p>
              </div>
            )}
          </>
        ) : (
          <>
            <GalleryGrid photos={filterPhotos(photos)} {...gridProps} />
            {/* Empty state for favorites filter */}
            {favFilter === 'favorites' && filterPhotos(photos).length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 gap-2">
                <Heart size={20} strokeWidth={1.25} style={{ color: 'rgba(201,169,110,0.3)' }} />
                <p className="font-sans text-xs text-stone-700">No favourites yet</p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="h-16" />
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
