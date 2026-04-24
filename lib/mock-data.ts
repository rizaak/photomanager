import type { Gallery, Photo, Photographer, UploadFile } from './types'

export const mockPhotographer: Photographer = {
  id: 'ph_1',
  name: 'Sarah Mitchell',
  email: 'sarah@sarahmitchell.com',
  plan: 'pro',
  storageUsedGB: 12.4,
  storageLimitGB: 100,
}

export const mockGalleries: Gallery[] = [
  {
    id: 'gal_1',
    title: 'Martinez Wedding',
    clientName: 'Elena & Marco Martinez',
    photoCount: 142,
    status: 'active',
    createdAt: '2026-04-10',
    expiresAt: '2026-05-10',
    downloadEnabled: false,
    coverColor: 'bg-stone-300',
  },
  {
    id: 'gal_2',
    title: 'Chen Family Session',
    clientName: 'The Chen Family',
    photoCount: 68,
    status: 'active',
    createdAt: '2026-04-05',
    expiresAt: '2026-05-05',
    downloadEnabled: true,
    coverColor: 'bg-stone-400',
  },
  {
    id: 'gal_3',
    title: 'Park Engagement',
    clientName: 'Julia & David Park',
    photoCount: 94,
    status: 'draft',
    createdAt: '2026-04-18',
    downloadEnabled: false,
    coverColor: 'bg-stone-200',
  },
  {
    id: 'gal_4',
    title: 'Thompson Newborn',
    clientName: 'The Thompson Family',
    photoCount: 51,
    status: 'archived',
    createdAt: '2026-03-02',
    downloadEnabled: true,
    coverColor: 'bg-stone-500',
  },
  {
    id: 'gal_5',
    title: 'Lee Corporate',
    clientName: 'Lee & Associates',
    photoCount: 37,
    status: 'active',
    createdAt: '2026-04-20',
    expiresAt: '2026-05-20',
    downloadEnabled: false,
    coverColor: 'bg-stone-300',
  },
  {
    id: 'gal_6',
    title: 'Nguyen Birthday',
    clientName: 'Minh Nguyen',
    photoCount: 83,
    status: 'active',
    createdAt: '2026-04-15',
    expiresAt: '2026-05-15',
    downloadEnabled: true,
    coverColor: 'bg-stone-400',
  },
]

// Varied aspect ratios simulating real photography sessions
const photoSpecs = [
  { w: 4000, h: 6000 }, // portrait 2:3
  { w: 6000, h: 4000 }, // landscape 3:2
  { w: 4000, h: 5000 }, // portrait 4:5
  { w: 6000, h: 4000 }, // landscape 3:2
  { w: 4000, h: 4000 }, // square 1:1
  { w: 4000, h: 6000 }, // portrait 2:3
  { w: 5000, h: 4000 }, // landscape 5:4
  { w: 4000, h: 6000 }, // portrait 2:3
  { w: 6000, h: 4000 }, // landscape 3:2
  { w: 4000, h: 5000 }, // portrait 4:5
  { w: 4000, h: 6000 }, // portrait 2:3
  { w: 4000, h: 4000 }, // square 1:1
  { w: 6000, h: 4000 }, // landscape 3:2
  { w: 4000, h: 6000 }, // portrait 2:3
  { w: 5000, h: 4000 }, // landscape 5:4
  { w: 4000, h: 5333 }, // portrait ~3:4
  { w: 6000, h: 4000 }, // landscape 3:2
  { w: 4000, h: 6000 }, // portrait 2:3
  { w: 4000, h: 4000 }, // square 1:1
  { w: 6000, h: 4000 }, // landscape 3:2
  { w: 4000, h: 5000 }, // portrait 4:5
  { w: 4000, h: 6000 }, // portrait 2:3
  { w: 6000, h: 4000 }, // landscape 3:2
  { w: 4000, h: 5000 }, // portrait 4:5
]

// Range of stone tones to simulate diverse photographic subjects
const photoColors = [
  'bg-stone-200', 'bg-stone-600', 'bg-stone-300', 'bg-stone-800',
  'bg-stone-400', 'bg-stone-700', 'bg-stone-200', 'bg-stone-500',
  'bg-stone-800', 'bg-stone-300', 'bg-stone-600', 'bg-stone-200',
  'bg-stone-700', 'bg-stone-400', 'bg-stone-900', 'bg-stone-300',
  'bg-stone-500', 'bg-stone-200', 'bg-stone-700', 'bg-stone-400',
  'bg-stone-800', 'bg-stone-300', 'bg-stone-600', 'bg-stone-200',
]

export const mockPhotos: Photo[] = Array.from({ length: 24 }, (_, i) => ({
  id: `photo_${i + 1}`,
  galleryId: 'gal_1',
  filename: `IMG_${String(1000 + i).padStart(4, '0')}.jpg`,
  width: photoSpecs[i].w,
  height: photoSpecs[i].h,
  status: 'ready',
  selected: [2, 5, 9, 14, 19].includes(i),
  placeholderColor: photoColors[i],
}))

export const mockUploadFiles: UploadFile[] = [
  { id: 'u_1', filename: 'IMG_0042.jpg', sizeMB: 3.2, status: 'ready', progress: 100 },
  { id: 'u_2', filename: 'IMG_0043.jpg', sizeMB: 4.1, status: 'processing', progress: 60 },
  { id: 'u_3', filename: 'IMG_0044.jpg', sizeMB: 5.8, status: 'uploading', progress: 30 },
  { id: 'u_4', filename: 'IMG_0044_raw.png', sizeMB: 120, status: 'error', progress: 0, errorMessage: 'File exceeds 50 MB limit' },
]
