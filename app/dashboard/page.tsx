import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { GalleryCard } from '@/components/gallery/GalleryCard'
import { mockGalleries } from '@/lib/mock-data'

export default function DashboardPage() {
  const activeGalleries = mockGalleries.filter((g) => g.status === 'active')
  const draftGalleries = mockGalleries.filter((g) => g.status === 'draft')
  const archivedGalleries = mockGalleries.filter((g) => g.status === 'archived')

  return (
    <div className="px-10 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
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

      {/* Active */}
      {activeGalleries.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xs font-sans text-stone-400 uppercase tracking-widest mb-5">Active</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeGalleries.map((g) => <GalleryCard key={g.id} gallery={g} />)}
          </div>
        </section>
      )}

      {/* Drafts */}
      {draftGalleries.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xs font-sans text-stone-400 uppercase tracking-widest mb-5">Drafts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {draftGalleries.map((g) => <GalleryCard key={g.id} gallery={g} />)}
          </div>
        </section>
      )}

      {/* Archived */}
      {archivedGalleries.length > 0 && (
        <section>
          <h2 className="text-xs font-sans text-stone-400 uppercase tracking-widest mb-5">Archived</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 opacity-60">
            {archivedGalleries.map((g) => <GalleryCard key={g.id} gallery={g} />)}
          </div>
        </section>
      )}
    </div>
  )
}
