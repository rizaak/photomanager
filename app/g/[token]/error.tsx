'use client'

// Error boundary for the gallery route.
// Catches unhandled errors that previously caused a blank screen.
export default function GalleryError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-3"
      style={{ backgroundColor: '#1C1917' }}
    >
      <p className="font-sans text-sm text-stone-600">Unable to load gallery</p>
      <button
        onClick={reset}
        className="text-xs font-sans text-stone-700 hover:text-stone-500 transition-colors underline underline-offset-2"
      >
        Try again
      </button>
    </div>
  )
}
