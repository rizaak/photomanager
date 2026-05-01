export type GalleryStatus = 'draft' | 'active' | 'archived'
// Tracks where the client is in the selection lifecycle
export type ClientActivity = 'not_opened' | 'selecting' | 'submitted'
export type PhotoStatus = 'uploading' | 'processing' | 'ready' | 'failed'
export type Plan = 'free' | 'pro' | 'studio'

export interface GalleryFolder {
  id: string
  name: string
  sortOrder: number
  galleryCount: number
  createdAt: string
}

export interface Gallery {
  id: string
  folderId?: string
  shareToken?: string
  title: string
  clientName: string
  photoCount: number
  status: GalleryStatus
  createdAt: string
  expiresAt?: string
  downloadEnabled: boolean
  coverColor:     string
  coverPhotoUrl?: string
  selectedCount?: number       // photos the client has marked
  clientActivity?: ClientActivity
  tags?: string[]
}

export interface PhotoComment {
  id: string
  body: string
  updatedAt: string
}

export interface Photo {
  id: string
  galleryId: string
  filename: string
  width: number
  height: number
  status: PhotoStatus
  selected: boolean    // kept for internal compat; not shown in client UI
  favorited: boolean
  placeholderColor: string
  thumbnailUrl?: string
  watermarkedUrl?: string
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
