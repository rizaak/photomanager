import { redirect } from 'next/navigation'

export default function WatermarksPage() {
  redirect('/dashboard/settings?tab=watermarks')
}
