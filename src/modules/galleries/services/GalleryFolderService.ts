import { GalleryFolderRepository } from '../repositories/GalleryFolderRepository'

export const GalleryFolderService = {
  async list(photographerId: string) {
    const folders = await GalleryFolderRepository.list(photographerId)
    return folders.map((f) => ({
      id:           f.id,
      name:         f.name,
      sortOrder:    f.sortOrder,
      galleryCount: f._count.galleries,
      createdAt:    f.createdAt.toISOString(),
    }))
  },

  async create(photographerId: string, name: string) {
    if (!name?.trim()) throw Object.assign(new Error('name is required'), { status: 400 })
    if (name.trim().length > 80) throw Object.assign(new Error('name too long'), { status: 400 })
    return GalleryFolderRepository.create(photographerId, name)
  },

  async rename(id: string, photographerId: string, name: string) {
    if (!name?.trim()) throw Object.assign(new Error('name is required'), { status: 400 })
    if (name.trim().length > 80) throw Object.assign(new Error('name too long'), { status: 400 })
    const folder = await GalleryFolderRepository.findById(id)
    if (!folder) throw Object.assign(new Error('Not found'), { status: 404 })
    if (folder.photographerId !== photographerId) throw Object.assign(new Error('Forbidden'), { status: 403 })
    return GalleryFolderRepository.update(id, { name: name.trim() })
  },

  async delete(id: string, photographerId: string) {
    const folder = await GalleryFolderRepository.findById(id)
    if (!folder) throw Object.assign(new Error('Not found'), { status: 404 })
    if (folder.photographerId !== photographerId) throw Object.assign(new Error('Forbidden'), { status: 403 })
    await GalleryFolderRepository.delete(id)
  },
}
