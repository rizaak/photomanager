// Suspense fallback for the gallery route.
// Required because page.tsx is a 'use client' component using use(params),
// which suspends during SSR. Without this, the page renders blank on direct refresh.
export default function GalleryLoading() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: '#1C1917' }}
    >
      <div className="w-5 h-5 rounded-full border border-stone-700 border-t-stone-500 animate-spin" />
    </div>
  )
}
