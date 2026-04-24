import Link from 'next/link'
import { ArrowLeft, Share2, Download, Settings, Eye } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { GalleryGrid } from '@/components/gallery/GalleryGrid'
import { mockGalleries, mockPhotos } from '@/lib/mock-data'
import type { GalleryStatus } from '@/lib/types'

export default async function GalleryManagementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const gallery = mockGalleries.find((g) => g.id === id) ?? mockGalleries[0]

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-stone-200 px-10 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-stone-400 hover:text-stone-700 text-sm font-sans transition-colors"
          >
            <ArrowLeft size={14} strokeWidth={1.5} />
            Galleries
          </Link>
          <span className="text-stone-200">/</span>
          <span className="text-sm font-sans text-stone-700 font-medium">{gallery.title}</span>
          <Badge variant={gallery.status as GalleryStatus} />
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/gallery/${gallery.id}`} target="_blank">
            <Button variant="ghost" size="sm">
              <Eye size={14} strokeWidth={1.5} />
              Preview
            </Button>
          </Link>
          <Button variant="secondary" size="sm">
            <Share2 size={14} strokeWidth={1.5} />
            Share Link
          </Button>
          {!gallery.downloadEnabled ? (
            <Button variant="primary" size="sm">
              <Download size={14} strokeWidth={1.5} />
              Enable Downloads
            </Button>
          ) : (
            <Button variant="secondary" size="sm">
              <Download size={14} strokeWidth={1.5} />
              Downloads On
            </Button>
          )}
          <Button variant="ghost" size="sm">
            <Settings size={14} strokeWidth={1.5} />
          </Button>
        </div>
      </header>

      {/* Gallery info */}
      <div className="px-10 pt-8 pb-6 border-b border-stone-100">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-serif text-3xl text-stone-900 mb-1">{gallery.title}</h1>
            <p className="text-stone-400 font-sans text-sm">{gallery.clientName}</p>
          </div>
          <div className="flex items-center gap-8 text-right">
            <div>
              <p className="text-2xl font-serif text-stone-900">{gallery.photoCount}</p>
              <p className="text-xs font-sans text-stone-400 uppercase tracking-widest">Photos</p>
            </div>
            <div>
              <p className="text-2xl font-serif text-stone-900">4</p>
              <p className="text-xs font-sans text-stone-400 uppercase tracking-widest">Selected</p>
            </div>
            {gallery.expiresAt && (
              <div>
                <p className="text-sm font-sans text-stone-600">{gallery.expiresAt}</p>
                <p className="text-xs font-sans text-stone-400 uppercase tracking-widest">Expires</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Photo grid */}
      <div className="p-6">
        <GalleryGrid photos={mockPhotos} selectable={false} />
      </div>
    </div>
  )
}

export function generateStaticParams() {
  return mockGalleries.map((g) => ({ id: g.id }))
}
