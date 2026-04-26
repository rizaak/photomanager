import { SelectionWorkflow } from '@prisma/client'
import { storageProvider } from '../../../infrastructure/storage/StorageProvider'
import { SelectionRepository } from '../repositories/SelectionRepository'
import { GalleryRepository } from '../../galleries/repositories/GalleryRepository'

const URL_EXPIRY = 3600

export type WorkflowState = 'IN_PROGRESS' | 'COMPLETED_BY_CLIENT' | 'IN_REVIEW' | 'EDITING' | 'DELIVERED'
export type PhotoEditStatus = 'NONE' | 'EDITING' | 'FINAL_READY'

export interface WorkflowPhoto {
  id:           string
  filename:     string
  width:        number
  height:       number
  thumbnailUrl: string | null
  editStatus:   PhotoEditStatus
  hasFinal:     boolean
}

export interface WorkflowData {
  id:            string
  clientName:    string | null
  submittedAt:   string
  workflowState: WorkflowState
  photoCount:    number
  photos:        WorkflowPhoto[]
}

async function assertOwnership(galleryId: string, photographerId: string) {
  const g = await GalleryRepository.findDetail(galleryId)
  if (!g || g.photographerId !== photographerId) {
    throw Object.assign(new Error('Gallery not found'), { status: 404 })
  }
}

export const WorkflowService = {
  async getForDashboard(galleryId: string, photographerId: string): Promise<WorkflowData | null> {
    await assertOwnership(galleryId, photographerId)

    const sel = await SelectionRepository.findSubmittedWithPhotos(galleryId)
    if (!sel) return null

    const photos: WorkflowPhoto[] = await Promise.all(
      sel.items.map(async ({ photo }) => ({
        id:           photo.id,
        filename:     photo.filename,
        width:        photo.width  ?? 3,
        height:       photo.height ?? 2,
        editStatus:   photo.editStatus as PhotoEditStatus,
        hasFinal:     !!photo.finalKey,
        thumbnailUrl: photo.thumbnailKey
          ? await storageProvider.getSignedUrl(photo.thumbnailKey, URL_EXPIRY)
          : null,
      })),
    )

    return {
      id:            sel.id,
      clientName:    sel.clientName,
      submittedAt:   sel.submittedAt!.toISOString(),
      workflowState: sel.workflowState as WorkflowState,
      photoCount:    sel._count.items,
      photos,
    }
  },

  async advanceWorkflow(
    galleryId:     string,
    photographerId: string,
    newState:      SelectionWorkflow,
  ): Promise<void> {
    await assertOwnership(galleryId, photographerId)

    const sel = await SelectionRepository.findSubmittedWithPhotos(galleryId)
    if (!sel) throw Object.assign(new Error('No submitted selection found'), { status: 404 })

    await SelectionRepository.updateWorkflowState(sel.id, newState)
  },
}
