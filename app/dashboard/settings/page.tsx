import { getAuthenticatedPhotographer } from '@/src/modules/auth/utils/getAuthenticatedPhotographer'
import { PhotographerRepository } from '@/src/modules/photographers/repositories/PhotographerRepository'
import { WatermarkService } from '@/src/modules/watermarks/services/WatermarkService'
import { SettingsClient } from '@/components/settings/SettingsClient'
import { notFound } from 'next/navigation'

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const photographerId = await getAuthenticatedPhotographer()

  const [profile, watermarkPresets] = await Promise.all([
    PhotographerRepository.findProfile(photographerId),
    WatermarkService.list(photographerId),
  ])

  if (!profile) notFound()

  const GB = 1024 ** 3
  const usedGB  = Math.round((Number(profile.storageUsedBytes) / GB) * 100) / 100
  const limitGB = profile.storageLimitGB
  const percent = limitGB > 0 ? Math.min(100, Math.round((usedGB / limitGB) * 1000) / 10) : 0

  return (
    <SettingsClient
      initialTab={tab ?? 'profile'}
      profile={{
        name:         profile.user.name,
        email:        profile.user.email,
        businessName: profile.businessName ?? '',
      }}
      subscription={{
        plan:    profile.plan.name,
        usedGB,
        limitGB,
        percent,
      }}
      initialWatermarkPresets={watermarkPresets}
    />
  )
}
