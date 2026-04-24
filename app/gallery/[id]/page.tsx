'use client'

import { use, useState } from 'react'
import { GalleryGrid } from '@/components/gallery/GalleryGrid'
import { Button } from '@/components/ui/Button'
import { mockGalleries, mockPhotos, mockPhotographer } from '@/lib/mock-data'
import { CheckCircle2, ArrowRight } from 'lucide-react'

export default function ClientGalleryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const gallery = mockGalleries.find((g) => g.id === id) ?? mockGalleries[0]
  const [selectedIds, setSelectedIds] = useState<string[]>(
    mockPhotos.filter((p) => p.selected).map((p) => p.id)
  )
  const [submitted, setSubmitted] = useState(false)

  if (submitted) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <CheckCircle2 size={48} strokeWidth={1} className="text-accent mx-auto mb-6" />
          <h2 className="font-serif text-3xl text-white mb-4">Selection submitted</h2>
          <p className="text-stone-400 font-sans text-sm leading-relaxed">
            Your photographer has been notified. You selected{' '}
            <strong className="text-stone-200">{selectedIds.length} photos</strong>.
            {' '}They will be in touch with your final delivery.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-950">
      {/* Header */}
      <header className="bg-stone-950 border-b border-stone-900 px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-600 font-sans uppercase tracking-widest mb-1">
              {mockPhotographer.name}
            </p>
            <h1 className="font-serif text-xl text-white">{gallery.title}</h1>
          </div>
          <p className="text-sm text-stone-500 font-sans hidden md:block">
            {mockPhotos.length} photos
          </p>
        </div>
      </header>

      {/* Instructions */}
      <div className="bg-stone-900/50 border-b border-stone-900 px-6 py-3">
        <p className="max-w-6xl mx-auto text-xs text-stone-500 font-sans text-center">
          Click a photo to select or deselect it. When you&apos;re happy with your choices, submit your selection below.
        </p>
      </div>

      {/* Photo grid */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <GalleryGrid
          photos={mockPhotos}
          selectable={true}
          onSelectionChange={setSelectedIds}
        />
      </div>

      {/* Sticky footer */}
      <div className="sticky bottom-0 bg-stone-950/95 backdrop-blur-sm border-t border-stone-900 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div>
            {selectedIds.length === 0 ? (
              <p className="text-stone-500 text-sm font-sans">No photos selected</p>
            ) : (
              <p className="text-white text-sm font-sans">
                <span className="font-medium text-accent">{selectedIds.length}</span>{' '}
                {selectedIds.length === 1 ? 'photo' : 'photos'} selected
              </p>
            )}
          </div>

          <Button
            variant="primary"
            size="md"
            disabled={selectedIds.length === 0}
            onClick={() => setSubmitted(true)}
          >
            Submit Selection
            <ArrowRight size={14} strokeWidth={2} />
          </Button>
        </div>
      </div>
    </div>
  )
}
