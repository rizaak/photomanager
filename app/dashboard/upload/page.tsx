import { ChevronDown } from 'lucide-react'
import { UploadZone } from '@/components/upload/UploadZone'
import { Button } from '@/components/ui/Button'
import { mockGalleries, mockUploadFiles } from '@/lib/mock-data'

export default function UploadPage() {
  return (
    <div className="px-10 py-10 max-w-3xl">
      {/* Header */}
      <div className="mb-10">
        <h1 className="font-serif text-3xl text-stone-900 mb-1">Upload Photos</h1>
        <p className="text-sm text-stone-400 font-sans">
          Add photos to an existing gallery or create a new one.
        </p>
      </div>

      {/* Gallery selector */}
      <div className="mb-8">
        <label className="block text-xs font-sans text-stone-500 uppercase tracking-widest mb-2">
          Gallery
        </label>
        <div className="relative">
          <select className="w-full appearance-none bg-white border border-stone-200 px-4 py-3 text-sm font-sans text-stone-700 pr-10 focus:outline-none focus:border-stone-400">
            <option value="">Select a gallery…</option>
            {mockGalleries
              .filter((g) => g.status !== 'archived')
              .map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title} — {g.clientName}
                </option>
              ))}
            <option value="new">+ Create new gallery</option>
          </select>
          <ChevronDown
            size={15}
            strokeWidth={1.5}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
          />
        </div>
      </div>

      {/* Upload zone */}
      <UploadZone initialFiles={mockUploadFiles} />

      {/* Actions */}
      <div className="mt-8 flex items-center justify-between">
        <p className="text-xs text-stone-400 font-sans">
          Files are processed in the background. You can leave this page safely.
        </p>
        <Button variant="primary" size="md" disabled>
          Upload All
        </Button>
      </div>
    </div>
  )
}
