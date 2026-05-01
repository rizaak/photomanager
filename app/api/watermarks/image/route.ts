import { NextRequest } from 'next/server'
import { handleUploadWatermarkImage } from '@/src/modules/watermarks/controllers/WatermarkController'

export const POST = (req: NextRequest) => handleUploadWatermarkImage(req)
