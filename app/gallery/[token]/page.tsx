'use client'

import { use, useState, useEffect, useRef, useCallback } from 'react'
import { ArrowDownToLine, Loader2, Check, RotateCcw, Send, CheckCheck, Lock } from 'lucide-react'
import { GalleryGrid } from '@/components/gallery/GalleryGrid'
import type { Photo } from '@/lib/types'

type ZipPhase     = 'idle' | 'preparing' | 'ready' | 'failed'
type FinalsPhase  = 'idle' | 'fetching' | 'done' | 'failed'
type PagePhase    = 'resolving' | 'password' | 'register' | 'loading' | 'ready' | 'error'

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

  // ── Access state ───────────────────────────────────────────────────────────
  const [phase,          setPhase]          = useState<PagePhase>('resolving')
  const [galleryId,      setGalleryId]      = useState<string | null>(null)
  const [galleryTitle,   setGalleryTitle]   = useState('')
  const [allowSelection, setAllowSelection] = useState(false)
  const [allowDownload,  setAllowDownload]  = useState(false)
  const [clientToken,    setClientToken]    = useState<string | undefined>(undefined)

  // ── Password gate ──────────────────────────────────────────────────────────
  const [passwordInput,  setPasswordInput]  = useState('')
  const [passwordError,  setPasswordError]  = useState<string | null>(null)
  const [submittingPass, setSubmittingPass] = useState(false)
  // Carry the accepted password through to the registration step
  const acceptedPassword = useRef<string | undefined>(undefined)

  // ── Registration gate ──────────────────────────────────────────────────────
  const [nameInput,    setNameInput]    = useState('')
  const [emailInput,   setEmailInput]   = useState('')
  const [regError,     setRegError]     = useState<string | null>(null)
  const [submittingReg, setSubmittingReg] = useState(false)

  // ── Gallery state ──────────────────────────────────────────────────────────
  const [photoSections, setPhotoSections] = useState<{ id: string; title: string; photos: Photo[] }[]>([])
  const [photos,        setPhotos]        = useState<Photo[]>([])
  const [selectedIds,   setSelectedIds]   = useState<string[]>([])
  const [uiVisible,     setUiVisible]     = useState(true)
  const [zipPhase,      setZipPhase]      = useState<ZipPhase>('idle')
  const [zipDownloadId, setZipDownloadId] = useState<string | null>(null)
  const [finalsPhase,   setFinalsPhase]   = useState<FinalsPhase>('idle')
  const [isSubmitted,   setIsSubmitted]   = useState(false)
  const [submitting,    setSubmitting]    = useState(false)

  const uiTimer    = useRef<ReturnType<typeof setTimeout>>(undefined)
  const zipPollRef = useRef<ReturnType<typeof setInterval>>(undefined)

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
      body:    JSON.stringify(opts),
    })

    const data = await res.json()

    if (res.ok) {
      // Success — persist clientToken if provided
      if (data.clientToken) {
        localStorage.setItem(storageKey(token), data.clientToken)
        setClientToken(data.clientToken)
      }
      setGalleryId(data.id)
      setGalleryTitle(data.title)
      setAllowSelection(data.allowSelection)
      setAllowDownload(data.allowDownload)
      setPhase('loading')
      return
    }

    if (res.status === 401 && data.code === 'PASSWORD_REQUIRED') {
      setPhase('password')
      return
    }
    if (res.status === 401 && data.code === 'WRONG_PASSWORD') {
      setPasswordError('Incorrect access code. Try again.')
      return
    }
    if (res.status === 403 && data.code === 'REGISTRATION_REQUIRED') {
      setPhase('register')
      return
    }

    setPhase('error')
  }, [token])

  // Initial probe: try stored client token first
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

    const headers: Record<string, string> = {}
    const ct = clientToken ?? localStorage.getItem(storageKey(token)) ?? undefined
    if (ct) headers['x-client-token'] = ct

    Promise.all([
      fetch(`/api/galleries/${galleryId}/photos`).then((r) => {
        if (!r.ok) throw new Error(`photos ${r.status}`)
        return r.json()
      }),
      fetch(`/api/galleries/${galleryId}/selection`, { headers }).then((r) => {
        if (!r.ok) throw new Error(`selection ${r.status}`)
        return r.json()
      }),
    ])
      .then(([photosData, selectionData]) => {
        const selectedSet = new Set<string>(selectionData.photoIds as string[])
        setSelectedIds(selectionData.photoIds)
        setIsSubmitted(!!selectionData.submittedAt)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        function hydrate(p: any): Photo {
          return { ...p, status: 'ready', selected: selectedSet.has(p.id), placeholderColor: placeholderColor(p.id) }
        }

        // Build section groups (only sections that have photos)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sections = (photosData.sections ?? []).filter((s: any) => s.photos.length > 0)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setPhotoSections(sections.map((s: any) => ({ id: s.id, title: s.title, photos: s.photos.map(hydrate) })))

        // Flat list of all photos (for selection tracking)
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

  // ── ZIP polling ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!galleryId || !zipDownloadId || zipPhase !== 'preparing') return

    zipPollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/galleries/${galleryId}/downloads/${zipDownloadId}`)
        if (!res.ok) { setZipPhase('failed'); clearInterval(zipPollRef.current); return }
        const data: { status: string; url?: string } = await res.json()

        if (data.status === 'READY' && data.url) {
          clearInterval(zipPollRef.current)
          setZipPhase('ready')
          const a = document.createElement('a')
          a.href = data.url; a.download = 'selection.zip'; a.rel = 'noopener noreferrer'
          document.body.appendChild(a); a.click(); document.body.removeChild(a)
          setTimeout(() => { setZipPhase('idle'); setZipDownloadId(null) }, 2500)
        } else if (data.status === 'FAILED') {
          clearInterval(zipPollRef.current); setZipPhase('failed')
        }
      } catch { clearInterval(zipPollRef.current); setZipPhase('failed') }
    }, 2000)

    return () => clearInterval(zipPollRef.current)
  }, [galleryId, zipDownloadId, zipPhase])

  function clientHeaders(): Record<string, string> {
    const ct = clientToken ?? localStorage.getItem(storageKey(token)) ?? undefined
    return ct ? { 'x-client-token': ct } : {}
  }

  async function handleRequestZip() {
    if (!galleryId || zipPhase === 'preparing') return
    setZipPhase('preparing'); setZipDownloadId(null)
    try {
      const res = await fetch(`/api/galleries/${galleryId}/downloads`, {
        method: 'POST', headers: clientHeaders(),
      })
      if (!res.ok) { setZipPhase('failed'); return }
      const { downloadId } = await res.json()
      setZipDownloadId(downloadId)
    } catch { setZipPhase('failed') }
  }

  async function handleDownloadFinals() {
    if (!galleryId || finalsPhase === 'fetching') return
    setFinalsPhase('fetching')
    try {
      const res = await fetch(`/api/galleries/${galleryId}/finals`, { headers: clientHeaders() })
      if (!res.ok) { setFinalsPhase('failed'); return }

      const data: { photos: { photoId: string; filename: string; url: string }[] } = await res.json()

      // Trigger each file download sequentially with a small delay so the browser handles them
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

  async function handleSubmit() {
    if (!galleryId || submitting || isSubmitted || selectedIds.length === 0) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/galleries/${galleryId}/selection/submit`, {
        method: 'POST', headers: clientHeaders(),
      })
      if (res.ok) setIsSubmitted(true)
    } catch { /* user can retry */ } finally { setSubmitting(false) }
  }

  function handlePhotoToggle(photoId: string, selected: boolean) {
    if (!galleryId) return
    setSelectedIds((prev) => selected ? [...prev, photoId] : prev.filter((s) => s !== photoId))
    fetch(`/api/galleries/${galleryId}/selection/toggle`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', ...clientHeaders() },
      body:    JSON.stringify({ photoId }),
    }).catch(console.error)
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
  const showActions = (allowSelection || allowDownload) && (selectedIds.length > 0 || isSubmitted)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1C1917' }}>

      <header
        className="fixed top-0 left-0 right-0 z-30 px-6 pt-5 pb-14 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(15,13,12,0.80) 0%, transparent 100%)', ...chromeFade }}
      >
        <div className="flex items-start justify-between">
          <h1 className="font-serif text-sm text-stone-400 leading-snug">{galleryTitle}</h1>

          <div
            className="flex items-center gap-2.5 pointer-events-auto"
            style={{ opacity: showActions ? 1 : 0, transition: 'opacity 400ms ease' }}
          >
            <span className="text-sm font-sans tabular-nums font-light pt-px" style={{ color: '#C9A96E', pointerEvents: 'none' }}>
              {selectedIds.length}
            </span>

            {allowSelection && (
              isSubmitted ? (
                <span className="pt-px flex items-center gap-1 text-stone-500" title="Selection submitted">
                  <CheckCheck size={13} strokeWidth={1.5} />
                </span>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting || selectedIds.length === 0}
                  className="pt-px text-stone-500 hover:text-stone-300 disabled:opacity-30 disabled:pointer-events-none transition-colors duration-200"
                  aria-label="Submit selection"
                >
                  {submitting ? <Loader2 size={13} strokeWidth={1.5} className="animate-spin" /> : <Send size={13} strokeWidth={1.5} />}
                </button>
              )
            )}

            {allowDownload && (
              <>
                {/* Finals download — individual signed files */}
                <button
                  onClick={finalsPhase === 'idle' || finalsPhase === 'failed' ? handleDownloadFinals : undefined}
                  disabled={finalsPhase === 'fetching' || finalsPhase === 'done'}
                  className="pt-px text-stone-500 hover:text-stone-300 disabled:pointer-events-none transition-colors duration-200 flex items-center gap-1"
                  aria-label="Download final photos"
                  title="Download final edited photos"
                >
                  {finalsPhase === 'idle'     && <ArrowDownToLine size={14} strokeWidth={1.5} />}
                  {finalsPhase === 'fetching' && <Loader2         size={14} strokeWidth={1.5} className="animate-spin" />}
                  {finalsPhase === 'done'     && <Check           size={14} strokeWidth={1.5} style={{ color: '#C9A96E' }} />}
                  {finalsPhase === 'failed'   && <RotateCcw       size={14} strokeWidth={1.5} style={{ color: '#ef4444' }} />}
                </button>

                {/* ZIP download — bulk selection */}
                <button
                  onClick={zipPhase === 'failed' || zipPhase === 'idle' ? handleRequestZip : undefined}
                  disabled={zipPhase === 'preparing' || zipPhase === 'ready'}
                  className="pt-px text-stone-500 hover:text-stone-300 disabled:pointer-events-none transition-colors duration-200"
                  aria-label="Download selected photos as zip"
                >
                  {zipPhase === 'idle'      && <ArrowDownToLine size={14} strokeWidth={1.5} className="opacity-50" />}
                  {zipPhase === 'preparing' && <Loader2         size={14} strokeWidth={1.5} className="animate-spin" />}
                  {zipPhase === 'ready'     && <Check           size={14} strokeWidth={1.5} style={{ color: '#C9A96E' }} />}
                  {zipPhase === 'failed'    && <RotateCcw       size={14} strokeWidth={1.5} style={{ color: '#ef4444' }} />}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="p-1 pt-14">
        {photoSections.length > 0 ? (
          // Grouped view
          <>
            {photoSections.map((section) => (
              <div key={section.id} className="mb-8">
                <div className="px-2 pb-3">
                  <p className="text-xs font-sans tracking-widest uppercase" style={{ color: 'rgba(168,163,158,0.55)' }}>
                    {section.title}
                  </p>
                </div>
                <GalleryGrid
                  photos={section.photos}
                  selectable={allowSelection}
                  onPhotoToggle={allowSelection ? handlePhotoToggle : undefined}
                />
              </div>
            ))}
            {/* Unsectioned photos below named sections */}
            {photos.filter((p) => !photoSections.some((s) => s.photos.find((sp) => sp.id === p.id))).length > 0 && (
              <div className="mt-4">
                <GalleryGrid
                  photos={photos.filter((p) => !photoSections.some((s) => s.photos.find((sp) => sp.id === p.id)))}
                  selectable={allowSelection}
                  onPhotoToggle={allowSelection ? handlePhotoToggle : undefined}
                />
              </div>
            )}
          </>
        ) : (
          // Flat view (no sections)
          <GalleryGrid
            photos={photos}
            selectable={allowSelection}
            onPhotoToggle={allowSelection ? handlePhotoToggle : undefined}
          />
        )}
      </div>
    </div>
  )
}
