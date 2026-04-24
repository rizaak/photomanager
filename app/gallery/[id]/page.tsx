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
    mockPhotos.filter((p) => p.selected).map((p) => p.id),
  )
  const [submitted, setSubmitted] = useState(false)

  if (submitted) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center px-6">
        <div className="text-center max-w-md" style={{ animation: 'scaleIn 300ms ease forwards' }}>
          <CheckCircle2 size={44} strokeWidth={1} className="text-accent mx-auto mb-7" />
          <h2 className="font-serif text-3xl text-white mb-4">Selection submitted</h2>
          <p className="text-stone-400 font-sans text-sm leading-relaxed">
            Your photographer has been notified. You selected{' '}
            <strong className="text-stone-200">{selectedIds.length}</strong>{' '}
            {selectedIds.length === 1 ? 'photo' : 'photos'}.
            They will be in touch with next steps.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#1C1917' }}>
      {/* Header — slightly darker than body for contrast */}
      <header className="border-b border-white/5 px-6 py-4 shrink-0" style={{ backgroundColor: '#141210' }}>
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] text-stone-500 font-sans uppercase tracking-[0.15em] mb-0.5">
              {mockPhotographer.name}
            </p>
            <h1 className="font-serif text-lg text-stone-100 leading-tight">{gallery.title}</h1>
          </div>
          <p className="text-sm text-stone-600 font-sans tabular-nums hidden sm:block">
            {mockPhotos.length} photos
          </p>
        </div>
      </header>

      {/* Instruction strip */}
      <div className="border-b border-white/[0.04] px-6 py-2.5 shrink-0" style={{ backgroundColor: '#191714' }}>
        <p className="text-[11px] text-stone-600 font-sans text-center tracking-wide">
          Click any photo to open it &nbsp;·&nbsp; Select your favorites &nbsp;·&nbsp; Submit when ready
        </p>
      </div>

      {/* Gallery — padded so shadows can breathe */}
      <div className="flex-1 p-3 sm:p-4">
        <GalleryGrid
          photos={mockPhotos}
          selectable={true}
          onSelectionChange={setSelectedIds}
        />
      </div>

      {/* Selection bar — slides up on first select, away when empty */}
      <div
        className="sticky bottom-0 shrink-0 border-t border-white/[0.06] px-6 py-3"
        style={{
          backgroundColor: 'rgba(20,18,16,0.72)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          transform: selectedIds.length === 0 ? 'translateY(110%)' : 'translateY(0)',
          opacity: selectedIds.length === 0 ? 0 : 1,
          transition: 'transform 380ms cubic-bezier(0.32,0.72,0,1), opacity 260ms ease',
        }}
      >
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-4">
          <p className="text-sm font-sans">
            <span className="text-accent font-medium tabular-nums">{selectedIds.length}</span>
            <span className="text-stone-500">
              {' '}{selectedIds.length === 1 ? 'photo' : 'photos'} selected
            </span>
          </p>

          <Button
            variant="primary"
            size="md"
            onClick={() => setSubmitted(true)}
            style={{ boxShadow: '0 0 28px rgba(201,169,110,0.2)' }}
          >
            Submit Selection
            <ArrowRight size={14} strokeWidth={2} />
          </Button>
        </div>
      </div>
    </div>
  )
}
