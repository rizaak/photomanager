export type GalleryStatus = 'draft' | 'active' | 'archived'
export type PhotoStatus = 'uploading' | 'processing' | 'ready' | 'failed'
export type Plan = 'free' | 'pro' | 'studio'

export interface Gallery {
  id: string
  title: string
  clientName: string
  photoCount: number
  status: GalleryStatus
  createdAt: string
  expiresAt?: string
  downloadEnabled: boolean
  coverColor: string
}

export interface Photo {
  id: string
  galleryId: string
  filename: string
  width: number
  height: number
  status: PhotoStatus
  selected: boolean
  placeholderColor: string
}

export interface Photographer {
  id: string
  name: string
  email: string
  plan: Plan
  storageUsedGB: number
  storageLimitGB: number
}

export interface UploadFile {
  id: string
  filename: string
  sizeMB: number
  status: 'uploading' | 'processing' | 'ready' | 'error'
  progress: number
  errorMessage?: string
}
