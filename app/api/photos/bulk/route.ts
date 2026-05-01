import { NextRequest } from 'next/server'
import { handleBulkAction } from '@/src/modules/photos/controllers/photoManagementController'

export const POST = (req: NextRequest) => handleBulkAction(req)
