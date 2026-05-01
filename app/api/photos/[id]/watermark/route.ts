import { NextRequest } from 'next/server'
import { handleApplyWatermark } from '@/src/modules/photos/controllers/photoManagementController'

type Ctx = { params: Promise<{ id: string }> }

export const POST = (req: NextRequest, ctx: Ctx) => handleApplyWatermark(req, ctx)
