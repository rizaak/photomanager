import { NextRequest } from 'next/server'
import { handleListWatermarks, handleCreateWatermark } from '@/src/modules/watermarks/controllers/WatermarkController'

export const GET  = () => handleListWatermarks()
export const POST = (req: NextRequest) => handleCreateWatermark(req)
