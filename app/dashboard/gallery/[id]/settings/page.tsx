import { notFound } from 'next/navigation'
import { getAuthenticatedPhotographer } from '@/src/modules/auth/utils/getAuthenticatedPhotographer'
import { GallerySettingsService } from '@/src/modules/galleries/services/GallerySettingsService'
import { PresetService } from '@/src/modules/presets/services/PresetService'
import { WatermarkService } from '@/src/modules/watermarks/services/WatermarkService'
import { GallerySettingsClient } from '@/components/gallery/GallerySettingsClient'

export default async function GallerySettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }         = await params
  const photographerId = await getAuthenticatedPhotographer()

  const [rawSettings, presets, watermarkPresets] = await Promise.all([
    GallerySettingsService.getSettings(id, photographerId).catch(() => null),
    PresetService.list(photographerId),
    WatermarkService.list(photographerId),
  ])

  if (!rawSettings) notFound()

  const settings = rawSettings as typeof rawSettings & {
    coverStyle:      'fullscreen' | 'split' | 'minimal'
    galleryLayout:   'masonry' | 'editorial' | 'uniform'
    typographyStyle: 'serif' | 'modern' | 'minimal'
    colorTheme:      'dark' | 'light' | 'warm'
  }

  return (
    <GallerySettingsClient
      galleryId={id}
      initialSettings={settings}
      initialPresets={presets}
      initialWatermarkPresets={watermarkPresets}
    />
  )
}
