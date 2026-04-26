import { SelectionWorkflow } from '@prisma/client'
import { prisma } from '../../../infrastructure/database/db'

export const SelectionRepository = {
  async findOrCreate(
    galleryId:       string,
    clientEmail:     string,
    clientName?:     string,
    galleryClientId?: string,
  ) {
    const existing = await prisma.selection.findFirst({
      where: { galleryId, clientEmail },
    })

    if (existing) {
      // Back-fill galleryClientId if we now have one and it wasn't linked before
      if (galleryClientId && !existing.galleryClientId) {
        return prisma.selection.update({
          where: { id: existing.id },
          data:  { galleryClientId, clientName: clientName ?? existing.clientName },
        })
      }
      return existing
    }

    return prisma.selection.create({
      data: { galleryId, clientEmail, clientName, galleryClientId },
    })
  },

  async getPhotoIds(selectionId: string): Promise<string[]> {
    const items = await prisma.selectionItem.findMany({
      where:  { selectionId },
      select: { photoId: true },
    })
    return items.map((i) => i.photoId)
  },

  async addPhoto(selectionId: string, photoId: string): Promise<void> {
    await prisma.selectionItem.upsert({
      where:  { selectionId_photoId: { selectionId, photoId } },
      update: {},
      create: { selectionId, photoId },
    })
  },

  async removePhoto(selectionId: string, photoId: string): Promise<void> {
    await prisma.selectionItem.deleteMany({
      where: { selectionId, photoId },
    })
  },

  async submit(selectionId: string): Promise<void> {
    await prisma.selection.update({
      where: { id: selectionId },
      data:  { submittedAt: new Date(), workflowState: SelectionWorkflow.COMPLETED_BY_CLIENT },
    })
  },

  async updateWorkflowState(selectionId: string, state: SelectionWorkflow): Promise<void> {
    await prisma.selection.update({
      where: { id: selectionId },
      data:  { workflowState: state },
    })
  },

  async findSubmittedWithPhotos(galleryId: string) {
    return prisma.selection.findFirst({
      where:   { galleryId, submittedAt: { not: null } },
      orderBy: { submittedAt: 'desc' },
      select: {
        id:            true,
        clientName:    true,
        clientEmail:   true,
        submittedAt:   true,
        workflowState: true,
        _count:        { select: { items: true } },
        items: {
          select: {
            photo: {
              select: {
                id:            true,
                filename:      true,
                thumbnailKey:  true,
                width:         true,
                height:        true,
                editStatus:    true,
              },
            },
          },
        },
      },
    })
  },
}
