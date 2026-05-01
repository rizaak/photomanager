import { NextRequest } from 'next/server'
import { handleListFolders, handleCreateFolder } from '@/src/modules/galleries/controllers/GalleryFolderController'

export const GET  = () => handleListFolders()
export const POST = (req: NextRequest) => handleCreateFolder(req)
