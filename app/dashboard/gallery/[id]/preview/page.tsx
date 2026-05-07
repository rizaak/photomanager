import { redirect } from 'next/navigation'

// This route is superseded by /dashboard/galleries/[id]/preview.
// next.config.ts redirects all /dashboard/gallery/* traffic there.
export default async function LegacyPreviewRedirect({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/dashboard/galleries/${id}/preview`)
}
