import type { GalleryEventType } from '@prisma/client'

// ── Labels ────────────────────────────────────────────────────────────────────

const EVENT_LABEL: Record<GalleryEventType, string> = {
  GALLERY_OPENED:      'Gallery opened',
  CLIENT_REGISTERED:   'Client registered',
  PHOTO_SELECTED:      'Photo selected',
  PHOTO_DESELECTED:    'Photo deselected',
  PHOTO_FAVORITED:     'Photo favourited',
  PHOTO_UNFAVORITED:   'Photo unfavourited',
  COMMENT_ADDED:       'Comment added',
  SELECTION_SUBMITTED: 'Selection submitted',
  FINAL_UPLOADED:      'Final uploaded',
  FINALS_READY:        'Finals marked as ready',
  DOWNLOAD_REQUESTED:  'Download requested',
}

const EVENT_DOT: Partial<Record<GalleryEventType, string>> = {
  CLIENT_REGISTERED:   'bg-stone-500',
  SELECTION_SUBMITTED: 'bg-amber-500',
  FINAL_UPLOADED:      'bg-blue-400',
  FINALS_READY:        'bg-amber-400',
  DOWNLOAD_REQUESTED:  'bg-stone-400',
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface ActivityEvent {
  id:        string
  eventType: GalleryEventType
  metadata:  unknown
  createdAt: string
}

interface Props {
  events: ActivityEvent[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function metadataHint(eventType: GalleryEventType, metadata: unknown): string | null {
  if (!metadata || typeof metadata !== 'object') return null
  const m = metadata as Record<string, unknown>

  if (eventType === 'CLIENT_REGISTERED' && m.email)  return String(m.email)
  if (eventType === 'SELECTION_SUBMITTED' && m.photoCount != null) return `${m.photoCount} photos`
  if (eventType === 'FINAL_UPLOADED' && m.photoId)  return `photo ${String(m.photoId).slice(0, 8)}…`
  if (eventType === 'FINALS_READY' && m.finalCount != null) return `${m.finalCount} finals`
  if (eventType === 'DOWNLOAD_REQUESTED' && m.count != null) return `${m.count} files`
  return null
}

// ── Component ─────────────────────────────────────────────────────────────────

export function GalleryActivityFeed({ events }: Props) {
  if (events.length === 0) {
    return (
      <p className="text-sm font-sans text-stone-400">No activity yet.</p>
    )
  }

  return (
    <ul className="space-y-0">
      {events.map((e) => {
        const hint = metadataHint(e.eventType, e.metadata)
        const dot  = EVENT_DOT[e.eventType] ?? 'bg-stone-200'
        return (
          <li key={e.id} className="flex items-center gap-3 py-2.5 border-b border-stone-100 last:border-0">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
            <span className="flex-1 text-sm font-sans text-stone-700">
              {EVENT_LABEL[e.eventType]}
              {hint && (
                <span className="text-stone-400 ml-2 text-xs">{hint}</span>
              )}
            </span>
            <span className="text-xs font-sans text-stone-400 shrink-0">{formatDate(e.createdAt)}</span>
          </li>
        )
      })}
    </ul>
  )
}
