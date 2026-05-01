import { NextRequest } from 'next/server'
import { handleDeletePhoto } from '@/src/modules/photos/controllers/photoManagementController'

type Ctx = { params: Promise<{ id: string }> }

export const DELETE = (req: NextRequest, ctx: Ctx) => handleDeletePhoto(req, ctx)
