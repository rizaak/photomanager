import Link from 'next/link'
import { Plus, Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { GalleryCard } from '@/components/gallery/GalleryCard'
import { getGalleryAction } from '@/lib/gallery-utils'
import { mockGalleries } from '@/lib/mock-data'

// Priority order: action-needed galleries float to the top
const ACTION_PRIORITY: Record<string, number> = {
  deliver:   0,
  selecting: 1,
  awaiting:  2,
  delivered: 3,
  share:     4,
  archived:  5,
}

function sortByPriority<T extends (typeof mockGalleries)[0]>(galleries: T[]) {
  return [...galleries].sort(
    (a, b) => (ACTION_PRIORITY[getGalleryAction(a)] ?? 9) - (ACTION_PRIORITY[getGalleryAction(b)] ?? 9),
  )
}

export default function DashboardPage() {
  const active   = sortByPriority(mockGalleries.filter((g) => g.status === 'active'))
  const drafts   = mockGalleries.filter((g) => g.status === 'draft')
  const archived = mockGalleries.filter((g) => g.status === 'archived')

  // Galleries where the client finished but the photographer hasn't unlocked download
  const readyToDeliver = active.filter(
    (g) => !g.downloadEnabled && g.clientActivity === 'submitted',
  )

  return (
    <div className="px-10 py-10">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-stone-900 mb-1">Your Galleries</h1>
          <p className="text-sm text-stone-400 font-sans">{mockGalleries.length} galleries</p>
        </div>
        <Link href="/dashboard/upload">
          <Button variant="primary" size="md">
            <Plus size={15} strokeWidth={2} />
            New Gallery
          </Button>
        </Link>
      </div>

      {/* ── Attention strip ── */}
      {/* Only shown when action is genuinely required — not informational noise */}
      {readyToDeliver.length > 0 && (
        <div
          className="mb-8 px-5 py-4 flex items-center justify-between gap-6"
          style={{
            backgroundColor: 'rgba(201,169,110,0.06)',
            border: '1px solid rgba(201,169,110,0.25)',
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
            <p className="text-sm font-sans text-stone-700">
              {readyToDeliver.length === 1
                ? `${readyToDeliver[0].clientName} finished selecting — ready to deliver`
                : `${readyToDeliver.length} clients finished selecting — ready to deliver`}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {readyToDeliver.map((g) => (
              <Link key={g.id} href={`/dashboard/gallery/${g.id}`}>
                <Button variant="primary" size="sm">
                  <Download size={13} strokeWidth={1.5} />
                  {readyToDeliver.length === 1 ? 'Enable download' : g.title}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Active ── */}
      {active.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xs font-sans text-stone-400 uppercase tracking-widest mb-5">Active</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {active.map((g) => <GalleryCard key={g.id} gallery={g} />)}
          </div>
        </section>
      )}

      {/* ── Drafts ── */}
      {drafts.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xs font-sans text-stone-400 uppercase tracking-widest mb-5">Drafts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {drafts.map((g) => <GalleryCard key={g.id} gallery={g} />)}
          </div>
        </section>
      )}

      {/* ── Archived ── */}
      {archived.length > 0 && (
        <section>
          <h2 className="text-xs font-sans text-stone-400 uppercase tracking-widest mb-5">Archived</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 opacity-60">
            {archived.map((g) => <GalleryCard key={g.id} gallery={g} />)}
          </div>
        </section>
      )}
    </div>
  )
}
