import { NextRequest } from 'next/server'
import { handleUpdateComment, handleDeleteComment } from '@/src/modules/comments/controllers/commentController'

export const PATCH  = (req: NextRequest, ctx: { params: Promise<{ id: string; commentId: string }> }) => handleUpdateComment(req, ctx)
export const DELETE = (req: NextRequest, ctx: { params: Promise<{ id: string; commentId: string }> }) => handleDeleteComment(req, ctx)
