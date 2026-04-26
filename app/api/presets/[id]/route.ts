export const runtime = 'nodejs'

export {
  handleUpdatePreset as PATCH,
  handleDeletePreset as DELETE,
} from '@/src/modules/presets/controllers/presetController'
