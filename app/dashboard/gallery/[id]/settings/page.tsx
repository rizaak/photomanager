import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getAuthenticatedPhotographer } from '@/src/modules/auth/utils/getAuthenticatedPhotographer'
import { GallerySettingsService } from '@/src/modules/galleries/services/GallerySettingsService'
import { PresetService } from '@/src/modules/presets/services/PresetService'
import { GallerySettingsClient } from '@/components/gallery/GallerySettingsClient'

export default async function GallerySettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const photographerId = await getAuthenticatedPhotographer()

  const [settings, presets] = await Promise.all([
    GallerySettingsService.getSettings(id, photographerId).catch(() => null),
    PresetService.list(photographerId),
  ])

  if (!settings) notFound()

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 bg-white border-b border-stone-200 px-10 h-14 flex items-center gap-4">
        <Link
          href={`/dashboard/gallery/${id}`}
          className="flex items-center gap-1.5 text-stone-400 hover:text-stone-700 text-sm font-sans transition-colors"
        >
          <ArrowLeft size={14} strokeWidth={1.5} />
          Back to gallery
        </Link>
        <span className="text-stone-200">/</span>
        <span className="text-sm font-sans text-stone-700 font-medium">Settings</span>
      </header>

      <GallerySettingsClient
        galleryId={id}
        initialSettings={settings}
        initialPresets={presets}
      />
    </div>
  )
}
