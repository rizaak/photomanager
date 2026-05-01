import { NextRequest } from 'next/server'
import { handleUpdateLabels } from '@/src/modules/photos/controllers/photoManagementController'

type Ctx = { params: Promise<{ id: string }> }

export const PATCH = (req: NextRequest, ctx: Ctx) => handleUpdateLabels(req, ctx)
