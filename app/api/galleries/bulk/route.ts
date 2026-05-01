import { NextRequest } from 'next/server'
import { handleBulkAction } from '@/src/modules/galleries/controllers/GalleryBulkController'

export const POST = (req: NextRequest) => handleBulkAction(req)
