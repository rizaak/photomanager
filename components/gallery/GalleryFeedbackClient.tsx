'use client'

import { useState, useMemo } from 'react'
import { Search, Heart, MessageCircle, X, FolderPlus, Check, Loader2 } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface FavoritedPhoto {
  photoId:      string
  thumbnailUrl: string | null
  createdAt:    string
}

interface CommentItem {
  id:            string
  photoId:       string
  body:          string
  photoFilename: string | null
  thumbnailUrl:  string | null
  createdAt:     string
}

interface ClientFeedback {
  id:        string
  name:      string
  email:     string
  favorites: FavoritedPhoto[]
  comments:  CommentItem[]
}

interface Props {
  galleryId:      string
  initialClients: ClientFeedback[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

function initial(name: string) {
  return name.trim().charAt(0).toUpperCase()
}

// ── PhotoModal ────────────────────────────────────────────────────────────────

function PhotoModal({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-stone-400 hover:text-white transition-colors"
        aria-label="Close"
      >
        <X size={20} strokeWidth={1.5} />
      </button>
      <img
        src={url}
        alt=""
        draggable={false}
        className="max-h-[90vh] max-w-[90vw] object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}

// ── Toggle ────────────────────────────────────────────────────────────────────

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex items-center justify-between w-full py-2"
    >
      <span className="text-sm font-sans text-stone-700">{label}</span>
      <span className={`w-8 h-4 rounded-full transition-colors relative ${value ? 'bg-stone-800' : 'bg-stone-200'}`}>
        <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </span>
    </button>
  )
}

// ── CreateSetModal ────────────────────────────────────────────────────────────

interface CreateSetResult {
  section:    { id: string; title: string }
  photoCount: number
}

function CreateSetModal({
  galleryId,
  clients,
  onClose,
  onCreated,
}: {
  galleryId: string
  clients:   ClientFeedback[]
  onClose:   () => void
  onCreated: (result: CreateSetResult) => void
}) {
  const clientsWithFavorites = clients.filter((c) => c.favorites.length > 0)

  const [title,            setTitle]            = useState('')
  const [clientId,         setClientId]         = useState<string>('all')
  const [visibleToClient,  setVisibleToClient]  = useState(true)
  const [watermarkEnabled, setWatermarkEnabled] = useState(true)
  const [loading,          setLoading]          = useState(false)
  const [error,            setError]            = useState<string | null>(null)
  const [result,           setResult]           = useState<CreateSetResult | null>(null)

  const selectedClient = clientId === 'all' ? null : clients.find((c) => c.id === clientId) ?? null
  const previewCount   = clientId === 'all'
    ? new Set(clients.flatMap((c) => c.favorites.map((f) => f.photoId))).size
    : (selectedClient?.favorites.length ?? 0)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/galleries/${galleryId}/sets/from-favorites`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          title:            title.trim(),
          clientId:         clientId === 'all' ? undefined : clientId,
          visibleToClient,
          watermarkEnabled,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to create set')
      }
      const data: CreateSetResult = await res.json()
      setResult(data)
      onCreated(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="relative bg-white w-full max-w-md mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <p className="text-sm font-sans font-medium text-stone-800">Create set from favorites</p>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 transition-colors">
            <X size={15} strokeWidth={1.5} />
          </button>
        </div>

        {result ? (
          /* Success state */
          <div className="px-5 py-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <Check size={12} strokeWidth={2} className="text-emerald-600" />
              </span>
              <p className="text-sm font-sans text-stone-800">
                <span className="font-medium">{result.section.title}</span> created with {result.photoCount} photo{result.photoCount !== 1 ? 's' : ''}.
              </p>
            </div>
            <p className="text-xs font-sans text-stone-400">
              The photos have been moved into the new section. You can reorder or rename it from the Photos tab.
            </p>
            <button
              onClick={onClose}
              className="w-full py-2 text-sm font-sans bg-stone-900 text-white hover:bg-stone-800 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={submit} className="px-5 py-5 space-y-4">
            {/* Set name */}
            <div>
              <label className="block text-[11px] font-sans uppercase tracking-widest text-stone-400 mb-1.5">
                Set name
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Client favorites"
                className="w-full px-3 py-2 text-sm font-sans text-stone-800 border border-stone-200 focus:outline-none focus:border-stone-500 transition-colors"
                autoFocus
              />
            </div>

            {/* Client source */}
            <div>
              <label className="block text-[11px] font-sans uppercase tracking-widest text-stone-400 mb-1.5">
                Source
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-2 text-sm font-sans text-stone-700 border border-stone-200 bg-white focus:outline-none focus:border-stone-500 transition-colors"
              >
                <option value="all">
                  All clients ({new Set(clients.flatMap((c) => c.favorites.map((f) => f.photoId))).size} unique photos)
                </option>
                {clientsWithFavorites.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.favorites.length} favorite{c.favorites.length !== 1 ? 's' : ''}
                  </option>
                ))}
              </select>
              {previewCount === 0 && (
                <p className="text-[11px] font-sans text-amber-600 mt-1">This client has no favorites.</p>
              )}
            </div>

            {/* Toggles */}
            <div className="border-t border-stone-100 pt-3 space-y-0.5">
              <Toggle value={visibleToClient}  onChange={setVisibleToClient}  label="Visible to client" />
              <Toggle value={watermarkEnabled} onChange={setWatermarkEnabled} label="Watermark enabled" />
              {!watermarkEnabled && (
                <p className="text-[11px] font-sans text-stone-400 pb-1">
                  Photos in this set will be shown without watermark using thumbnail-quality previews.
                </p>
              )}
            </div>

            {error && (
              <p className="text-xs font-sans text-red-500">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !title.trim() || previewCount === 0}
              className="w-full py-2.5 text-sm font-sans bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={13} strokeWidth={1.5} className="animate-spin" />
                  Creating…
                </span>
              ) : (
                `Create set · ${previewCount} photo${previewCount !== 1 ? 's' : ''}`
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// ── ClientCard ────────────────────────────────────────────────────────────────

function ClientCard({
  client,
  onOpenPhoto,
}: {
  client:      ClientFeedback
  onOpenPhoto: (url: string) => void
}) {
  return (
    <div className="border border-stone-100 bg-white">
      {/* Client header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-stone-100">
        <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center shrink-0 text-sm font-sans font-medium text-stone-600">
          {initial(client.name)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-sans font-medium text-stone-800 truncate">{client.name}</p>
          <p className="text-[11px] font-sans text-stone-400 truncate">{client.email}</p>
        </div>
        <div className="ml-auto flex items-center gap-3 shrink-0">
          {client.favorites.length > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-sans text-stone-400">
              <Heart size={10} strokeWidth={0} fill="#f87171" />
              {client.favorites.length}
            </span>
          )}
          {client.comments.length > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-sans text-stone-400">
              <MessageCircle size={10} strokeWidth={1.5} />
              {client.comments.length}
            </span>
          )}
        </div>
      </div>

      <div className="px-5 py-4 space-y-5">
        {/* Favorites strip */}
        {client.favorites.length > 0 && (
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-sans uppercase tracking-widest text-stone-400 mb-2.5">
              <Heart size={9} strokeWidth={0} fill="#f87171" />
              Favorites
            </p>
            <div className="flex flex-wrap gap-1.5">
              {client.favorites.map((f) => (
                <button
                  key={f.photoId}
                  title={`Favorited ${fmt(f.createdAt)}`}
                  onClick={() => f.thumbnailUrl && onOpenPhoto(f.thumbnailUrl)}
                  className="w-14 h-14 bg-stone-100 overflow-hidden shrink-0 relative group"
                >
                  {f.thumbnailUrl ? (
                    <img src={f.thumbnailUrl} alt="" draggable={false} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-stone-200" />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Comments */}
        {client.comments.length > 0 && (
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-sans uppercase tracking-widest text-stone-400 mb-2.5">
              <MessageCircle size={10} strokeWidth={1.5} />
              Comments
            </p>
            <ul className="space-y-3">
              {client.comments.map((c) => (
                <li key={c.id} className="flex gap-3">
                  {/* Photo thumbnail */}
                  <button
                    onClick={() => c.thumbnailUrl && onOpenPhoto(c.thumbnailUrl)}
                    className="w-10 h-10 bg-stone-100 overflow-hidden shrink-0 relative group"
                    title="View photo"
                  >
                    {c.thumbnailUrl ? (
                      <img src={c.thumbnailUrl} alt="" draggable={false} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-stone-200" />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  </button>
                  {/* Comment body */}
                  <div className="flex-1 min-w-0">
                    {c.photoFilename && (
                      <p className="text-[10px] font-sans text-stone-400 truncate mb-0.5">{c.photoFilename}</p>
                    )}
                    <p className="text-sm font-sans text-stone-700 leading-relaxed">{c.body}</p>
                    <p className="text-[10px] font-sans text-stone-300 mt-1">{fmt(c.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

// ── GalleryFeedbackClient ─────────────────────────────────────────────────────

export function GalleryFeedbackClient({ galleryId, initialClients }: Props) {
  const [search,        setSearch]        = useState('')
  const [commentsOnly,  setCommentsOnly]  = useState(false)
  const [openPhotoUrl,  setOpenPhotoUrl]  = useState<string | null>(null)
  const [showCreateSet, setShowCreateSet] = useState(false)
  const [clients,       setClients]       = useState(initialClients)

  const filtered = useMemo(() => {
    let list = clients
    if (commentsOnly) list = list.filter(c => c.comments.length > 0)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
      )
    }
    return list
  }, [clients, search, commentsOnly])

  const hasFavorites = clients.some((c) => c.favorites.length > 0)

  if (initialClients.length === 0) {
    return (
      <p className="text-sm font-sans text-stone-400">
        No client feedback yet. Favorites and comments will appear here once clients engage with the gallery.
      </p>
    )
  }

  return (
    <>
      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={11} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by client name or email…"
            className="w-full pl-8 pr-3 py-1.5 text-xs font-sans text-stone-700 placeholder-stone-300 bg-white border border-stone-200 focus:outline-none focus:border-stone-400 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500"
            >
              <X size={10} strokeWidth={2} />
            </button>
          )}
        </div>

        <button
          onClick={() => setCommentsOnly(v => !v)}
          className={`px-2.5 py-1.5 text-xs font-sans border transition-colors ${
            commentsOnly
              ? 'bg-stone-900 border-stone-900 text-white'
              : 'bg-white border-stone-200 text-stone-500 hover:border-stone-400 hover:text-stone-700'
          }`}
        >
          Has comments
        </button>

        <p className="text-[11px] font-sans text-stone-400 ml-1 mr-auto">
          {filtered.length} client{filtered.length !== 1 ? 's' : ''}
        </p>

        {hasFavorites && (
          <button
            onClick={() => setShowCreateSet(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-sans border border-stone-200 text-stone-500 hover:border-stone-400 hover:text-stone-700 transition-colors bg-white"
          >
            <FolderPlus size={11} strokeWidth={1.5} />
            Create set
          </button>
        )}
      </div>

      {/* Client list */}
      {filtered.length === 0 ? (
        <p className="text-sm font-sans text-stone-400">No clients match your filters.</p>
      ) : (
        <div className="space-y-4">
          {filtered.map(client => (
            <ClientCard
              key={client.id}
              client={client}
              onOpenPhoto={setOpenPhotoUrl}
            />
          ))}
        </div>
      )}

      {/* Photo modal */}
      {openPhotoUrl && (
        <PhotoModal url={openPhotoUrl} onClose={() => setOpenPhotoUrl(null)} />
      )}

      {/* Create set modal */}
      {showCreateSet && (
        <CreateSetModal
          galleryId={galleryId}
          clients={clients}
          onClose={() => setShowCreateSet(false)}
          onCreated={() => {
            // Optimistically clear favorites from the local client list since
            // photos were moved into the new section — the page data is now stale.
            setClients((prev) => prev.map((c) => ({ ...c, favorites: [] })))
          }}
        />
      )}
    </>
  )
}
