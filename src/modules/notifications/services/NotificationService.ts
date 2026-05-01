import { prisma } from '../../../infrastructure/database/db'
import { emailProvider } from '../../../infrastructure/email/EmailProvider'
import { templates } from '../../../infrastructure/email/templates'

// ── URL helpers ────────────────────────────────────────────────────────────────

function baseUrl(): string {
  return process.env.APP_BASE_URL ?? 'http://localhost:3000'
}

function dashboardUrl(galleryId: string): string {
  return `${baseUrl()}/dashboard/gallery/${galleryId}`
}

function galleryUrl(shareToken: string): string {
  return `${baseUrl()}/gallery/${shareToken}`
}

// ── DB context ─────────────────────────────────────────────────────────────────

async function getGalleryContext(galleryId: string) {
  return prisma.gallery.findUnique({
    where:  { id: galleryId },
    select: {
      title:      true,
      shareToken: true,
      photographer: {
        select: { user: { select: { email: true, name: true } } },
      },
    },
  })
}

// ── Handlers ───────────────────────────────────────────────────────────────────

async function onClientRegistered(payload: Record<string, unknown>) {
  const galleryId   = payload.galleryId   as string
  const clientName  = (payload.clientName  as string | undefined) ?? 'A client'
  const clientEmail = (payload.clientEmail as string | undefined) ?? ''

  const gallery = await getGalleryContext(galleryId)
  if (!gallery) return

  const { html, text } = templates.clientRegistered({
    clientName,
    clientEmail,
    galleryTitle: gallery.title,
    dashboardUrl: dashboardUrl(galleryId),
  })

  await emailProvider.sendEmail({
    to:      gallery.photographer.user.email,
    subject: `New client registered — ${gallery.title}`,
    html,
    text,
  })
}

async function onSelectionSubmitted(payload: Record<string, unknown>) {
  const galleryId  = payload.galleryId  as string
  const photoCount = (payload.photoCount as number | undefined) ?? 0

  const gallery = await getGalleryContext(galleryId)
  if (!gallery) return

  // Look up client name from the submitted selection
  const selection = await prisma.selection.findFirst({
    where:   { galleryId, submittedAt: { not: null } },
    orderBy: { submittedAt: 'desc' },
    select:  { clientName: true },
  })

  const { html, text } = templates.selectionSubmitted({
    clientName:   selection?.clientName ?? 'Your client',
    photoCount,
    galleryTitle: gallery.title,
    dashboardUrl: dashboardUrl(galleryId),
  })

  await emailProvider.sendEmail({
    to:      gallery.photographer.user.email,
    subject: `Selection submitted — ${gallery.title}`,
    html,
    text,
  })
}

async function onCommentAdded(payload: Record<string, unknown>) {
  const galleryId  = payload.galleryId  as string
  const clientName = (payload.clientName as string | undefined) ?? 'A client'
  const comment    = (payload.comment    as string | undefined) ?? ''

  const gallery = await getGalleryContext(galleryId)
  if (!gallery) return

  const { html, text } = templates.commentAdded({
    clientName,
    galleryTitle: gallery.title,
    comment,
    dashboardUrl: dashboardUrl(galleryId),
  })

  await emailProvider.sendEmail({
    to:      gallery.photographer.user.email,
    subject: `New comment — ${gallery.title}`,
    html,
    text,
  })
}

async function onDownloadRequested(payload: Record<string, unknown>) {
  const galleryId = payload.galleryId as string
  const count     = (payload.count    as number | undefined) ?? 0
  const type      = (payload.type     as string | undefined) ?? 'finals'

  const gallery = await getGalleryContext(galleryId)
  if (!gallery) return

  const { html, text } = templates.downloadRequested({
    galleryTitle: gallery.title,
    count,
    type,
    dashboardUrl: dashboardUrl(galleryId),
  })

  await emailProvider.sendEmail({
    to:      gallery.photographer.user.email,
    subject: `Download requested — ${gallery.title}`,
    html,
    text,
  })
}

async function onFinalsReady(payload: Record<string, unknown>) {
  const galleryId   = payload.galleryId   as string
  const clientEmail = payload.clientEmail as string | undefined
  const finalCount  = (payload.finalCount as number | undefined) ?? 0

  if (!clientEmail || clientEmail === 'anonymous@gallery.local') return

  const gallery = await getGalleryContext(galleryId)
  if (!gallery) return

  const { html, text } = templates.finalsReady({
    galleryTitle: gallery.title,
    finalCount,
    galleryUrl:   galleryUrl(gallery.shareToken),
  })

  await emailProvider.sendEmail({
    to:      clientEmail,
    subject: `Your edited photos are ready — ${gallery.title}`,
    html,
    text,
  })
}

// ── Dispatcher ─────────────────────────────────────────────────────────────────

export const NotificationService = {
  async process(type: string, payload: Record<string, unknown>): Promise<void> {
    switch (type) {
      case 'CLIENT_REGISTERED':   return onClientRegistered(payload)
      case 'SELECTION_SUBMITTED': return onSelectionSubmitted(payload)
      case 'COMMENT_ADDED':       return onCommentAdded(payload)
      case 'DOWNLOAD_REQUESTED':  return onDownloadRequested(payload)
      case 'FINALS_READY':        return onFinalsReady(payload)
      default:
        console.log(`[notifications] unhandled type: ${type}`)
    }
  },
}
