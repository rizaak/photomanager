export const runtime = 'nodejs'

export {
  handleGetSettings    as GET,
  handleUpdateSettings as PATCH,
} from '@/src/modules/galleries/controllers/gallerySettingsController'
