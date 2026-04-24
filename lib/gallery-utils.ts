import type { Gallery } from './types'

export type GalleryAction = 'share' | 'awaiting' | 'selecting' | 'deliver' | 'delivered' | 'archived'

export function getGalleryAction(g: Gallery): GalleryAction {
  if (g.status === 'draft') return 'share'
  if (g.status === 'archived') return 'archived'
  if (g.downloadEnabled) return 'delivered'
  if (!g.clientActivity || g.clientActivity === 'not_opened') return 'awaiting'
  if (g.clientActivity === 'submitted') return 'deliver'
  return 'selecting'
}
