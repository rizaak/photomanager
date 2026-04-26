import { ClientActivity } from '@prisma/client'
import { prisma } from '../../../infrastructure/database/db'

export interface CreateGalleryInput {
  title:        string
  clientName:   string
  clientEmail?: string
  password?:    string
}

export const GalleryRepository = {
  // ── Lookup ─────────────────────────────────────────────────────────────────
  async findPhotographerByEmail(email: string) {
    return prisma.photographerProfile.findFirst({
      where:  { user: { email } },
      select: { id: true },
    })
  },

  async findByShareToken(token: string) {
    return prisma.gallery.findUnique({
      where:  { shareToken: token },
      select: {
        id:                true,
        title:             true,
        status:            true,
        password:          true,
        allowSelection:    true,
        downloadEnabled:   true,
        requireClientInfo: true,
      },
    })
  },

  // Lightweight permissions check for sub-resource endpoints
  async findPermissions(galleryId: string) {
    return prisma.gallery.findUnique({
      where:  { id: galleryId },
      select: { allowSelection: true, downloadEnabled: true, status: true },
    })
  },

  async findDetail(galleryId: string) {
    return prisma.gallery.findUnique({
      where: { id: galleryId },
      select: {
        id:              true,
        photographerId:  true,
        title:           true,
        clientName:      true,
        status:          true,
        clientActivity:  true,
        downloadEnabled: true,
        shareToken:      true,
        _count:          { select: { photos: true } },
        selections: {
          orderBy: { createdAt: 'desc' },
          take:    1,
          select: {
            id:          true,
            submittedAt: true,
            _count:      { select: { items: true } },
          },
        },
      },
    })
  },

  // ── List ───────────────────────────────────────────────────────────────────
  async findAllForPhotographer(photographerId: string) {
    return prisma.gallery.findMany({
      where:   { photographerId },
      orderBy: { createdAt: 'desc' },
      select: {
        id:              true,
        title:           true,
        clientName:      true,
        status:          true,
        clientActivity:  true,
        downloadEnabled: true,
        shareToken:      true,
        createdAt:       true,
        expiresAt:       true,
        _count:          { select: { photos: true } },
        selections: {
          orderBy: { createdAt: 'desc' },
          take:    1,
          select:  { _count: { select: { items: true } } },
        },
      },
    })
  },

  // ── Write ──────────────────────────────────────────────────────────────────
  async create(photographerId: string, data: CreateGalleryInput) {
    return prisma.gallery.create({
      data: {
        photographerId,
        title:       data.title,
        clientName:  data.clientName,
        clientEmail: data.clientEmail,
        password:    data.password,
      },
      select: { id: true, shareToken: true, title: true, clientName: true },
    })
  },

  async updateClientActivity(galleryId: string, activity: ClientActivity): Promise<void> {
    await prisma.gallery.update({
      where: { id: galleryId },
      data:  { clientActivity: activity },
    })
  },
}
