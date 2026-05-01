import { NextRequest } from 'next/server'
import {
  handleGetWatermark,
  handleUpdateWatermark,
  handleDeleteWatermark,
} from '@/src/modules/watermarks/controllers/WatermarkController'

type Ctx = { params: Promise<{ id: string }> }

export const GET    = (req: NextRequest, ctx: Ctx) => handleGetWatermark(req, ctx)
export const PATCH  = (req: NextRequest, ctx: Ctx) => handleUpdateWatermark(req, ctx)
export const DELETE = (req: NextRequest, ctx: Ctx) => handleDeleteWatermark(req, ctx)
