'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { GalleryGrid, type GalleryLayout } from '@/components/gallery/GalleryGrid'
import type { Photo } from '@/lib/types'

type CoverStyle = 'fullscreen' | 'split' | 'minimal'
type ColorTheme = 'dark' | 'light' | 'warm'

const THEMES: Record<ColorTheme, { bg: string; text: string; subtext: string; border: string }> = {
  dark:  { bg: '#1C1917', text: '#d6d3d1', subtext: '#78716c', border: 'rgba(255,255,255,0.06)' },
  light: { bg: '#F7F5F2', text: '#1c1917', subtext: '#78716c', border: 'rgba(0,0,0,0.08)'       },
  warm:  { bg: '#181210', text: '#d6c5b0', subtext: '#8c7560', border: 'rgba(255,255,255,0.06)' },
}

const HIDE_DELAY = 3800

const PLACEHOLDER_COLORS = [
  'bg-stone-700', 'bg-stone-600', 'bg-stone-800',
  'bg-stone-500', 'bg-stone-700', 'bg-stone-600',
]
function placeholderColor(id: string): string {
  const n = id.charCodeAt(0) + id.charCodeAt(id.length - 1)
  return PLACEHOLDER_COLORS[n % PLACEHOLDER_COLORS.length]
}

interface Props {
  galleryId:     string
  title:         string
  subtitle:      string | null
  eventDate:     string | null
  coverPhotoId:  string | null
  coverStyle:    CoverStyle
  galleryLayout: GalleryLayout
  typographyStyle: string
  colorTheme:    ColorTheme
}

export function GalleryPreviewClient({
  galleryId,
  title,
  subtitle,
  eventDate,
  coverPhotoId,
  coverStyle,
  galleryLayout,
  typographyStyle,
  colorTheme,
}: Props) {
  const [photos,        setPhotos]        = useState<Photo[]>([])
  const [photoSections, setPhotoSections] = useState<{ id: string; title: string; photos: Photo[] }[]>([])
  const [activeTab,     setActiveTab]     = useState('all')
  const [loading,       setLoading]       = useState(true)
  const [uiVisible,     setUiVisible]     = useState(true)
  const uiTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    fetch(`/api/galleries/${galleryId}/photos?includeHidden=1`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) return

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        function hydrate(p: any): Photo {
          return { ...p, status: 'ready', selected: false, favorited: false, placeholderColor: placeholderColor(p.id) }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sections = (data.sections ?? []).filter((s: any) => s.photos.length > 0)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setPhotoSections(sections.map((s: any) => ({ id: s.id, title: s.title, photos: s.photos.map(hydrate) })))
        if (sections.length > 0) setActiveTab(sections[0].id)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const all = [...sections.flatMap((s: any) => s.photos), ...(data.unsectioned ?? data.photos ?? [])]
        setPhotos(all.map(hydrate))
      })
      .catch(() => { /* non-critical in preview */ })
      .finally(() => setLoading(false))
  }, [galleryId])

  const revealUi = useCallback(() => {
    setUiVisible(true)
    clearTimeout(uiTimer.current)
    uiTimer.current = setTimeout(() => setUiVisible(false), HIDE_DELAY)
  }, [])

  useEffect(() => {
    revealUi()
    window.addEventListener('mousemove',  revealUi)
    window.addEventListener('scroll',     revealUi, { passive: true })
    window.addEventListener('touchstart', revealUi, { passive: true })
    return () => {
      window.removeEventListener('mousemove',  revealUi)
      window.removeEventListener('scroll',     revealUi)
      window.removeEventListener('touchstart', revealUi)
      clearTimeout(uiTimer.current)
    }
  }, [revealUi])

  const theme     = THEMES[colorTheme]
  const titleClass = typographyStyle === 'modern'
    ? 'font-sans font-light tracking-[0.2em] uppercase'
    : typographyStyle === 'minimal'
      ? 'font-sans font-medium tracking-[0.15em] uppercase text-sm'
      : 'font-serif'

  const chromeFade: React.CSSProperties = { opacity: uiVisible ? 1 : 0, transition: 'opacity 600ms ease' }

  const tabs = photoSections.map((s) => ({ id: s.id, label: s.title }))
  const showTabs = tabs.length > 1

  const tabPhotos: Photo[] = (() => {
    const section = photoSections.find((s) => s.id === activeTab)
    if (section) return section.photos
    return photos
  })()

  const coverPhoto    = coverPhotoId ? photos.find((p) => p.id === coverPhotoId) : null
  const coverPhotoUrl = (coverPhoto ?? photos[0])?.watermarkedUrl ?? null

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.bg }}>
        <div className="w-5 h-5 rounded-full border border-stone-700 border-t-stone-500 animate-spin" />
      </div>
    )
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: theme.bg, color: theme.text, userSelect: 'none', WebkitUserSelect: 'none' } as React.CSSProperties}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Preview banner */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-4 px-4 py-2 bg-stone-950/95 border-b border-stone-900 backdrop-blur-sm">
        <div className="flex items-center gap-3 min-w-0">
          <span className="shrink-0 text-[10px] font-sans uppercase tracking-widest" style={{ color: '#C9A96E' }}>
            Preview
          </span>
          <span className="text-[11px] font-sans text-stone-500 truncate">
            This is how clients see your gallery · Favorites and comments are disabled
          </span>
        </div>
        <button
          onClick={() => window.close()}
          className="shrink-0 text-[11px] font-sans text-stone-600 hover:text-stone-400 transition-colors"
        >
          Close
        </button>
      </div>

      {/* Push content below preview banner */}
      <div className="h-[38px]" />

      <header
        className="fixed top-[38px] left-0 right-0 z-30 px-6 pt-5 pb-14 pointer-events-none"
        style={{ background: `linear-gradient(to bottom, ${colorTheme === 'light' ? 'rgba(247,245,242,0.90)' : 'rgba(15,13,12,0.80)'} 0%, transparent 100%)`, ...chromeFade }}
      >
        <h1 className={`text-sm leading-snug ${titleClass}`} style={{ color: theme.subtext }}>{title}</h1>
      </header>

      <PreviewCover
        style={coverStyle}
        title={title}
        subtitle={subtitle}
        eventDate={eventDate}
        coverUrl={coverPhotoUrl}
        theme={theme}
        titleClass={titleClass}
      />

      {showTabs && (
        <div className="overflow-x-auto px-3 pb-4 pt-3" style={{ scrollbarWidth: 'none' }}>
          <div className="flex gap-2 min-w-max">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-sans transition-all duration-200"
                  style={{
                    backgroundColor: isActive
                      ? 'rgba(201,169,110,0.15)'
                      : colorTheme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
                    color: isActive ? '#C9A96E' : theme.subtext,
                    border: isActive ? '1px solid rgba(201,169,110,0.3)' : '1px solid transparent',
                  }}
                  aria-pressed={isActive}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="p-1">
        <GalleryGrid
          photos={tabPhotos}
          layout={galleryLayout}
          favoritedIds={new Set()}
          photoComments={new Map()}
          allowComments={false}
        />
      </div>

      <div className="h-16" />
    </div>
  )
}

// ── PreviewCover ───────────────────────────────────────────────────────────────

function PreviewCover({
  style,
  title,
  subtitle,
  eventDate,
  coverUrl,
  theme,
  titleClass,
}: {
  style:      CoverStyle
  title:      string
  subtitle:   string | null
  eventDate:  string | null
  coverUrl:   string | null
  theme:      typeof THEMES[ColorTheme]
  titleClass: string
}) {
  const formattedDate = eventDate
    ? new Date(eventDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  if (style === 'fullscreen' && coverUrl) {
    return (
      <div className="relative w-full" style={{ height: '100vh' }}>
        <img
          src={coverUrl}
          alt=""
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ userSelect: 'none', WebkitUserSelect: 'none', pointerEvents: 'none', WebkitUserDrag: 'none' } as React.CSSProperties}
        />
        <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${theme.bg} 0%, transparent 50%)` }} />
        <div className="absolute bottom-0 left-0 right-0 px-8 pb-10">
          <h1 className={`text-3xl mb-1.5 ${titleClass}`} style={{ color: theme.text }}>{title}</h1>
          {subtitle && <p className="font-sans text-sm" style={{ color: theme.subtext }}>{subtitle}</p>}
          {formattedDate && <p className="font-sans text-xs mt-1 tracking-wider" style={{ color: theme.subtext }}>{formattedDate}</p>}
        </div>
      </div>
    )
  }

  if (style === 'split') {
    return (
      <div className="w-full pt-20 pb-8 px-8 flex items-center gap-10 min-h-[50vh]">
        <div className="flex-1 max-w-xs">
          <h1 className={`text-3xl mb-3 ${titleClass}`} style={{ color: theme.text }}>{title}</h1>
          {subtitle && <p className="font-sans text-sm leading-relaxed mb-3" style={{ color: theme.subtext }}>{subtitle}</p>}
          {formattedDate && <p className="font-sans text-xs tracking-wider" style={{ color: theme.subtext }}>{formattedDate}</p>}
        </div>
        {coverUrl && (
          <div className="flex-1 max-w-md aspect-[4/3] overflow-hidden">
            <img
              src={coverUrl}
              alt=""
              draggable={false}
              className="w-full h-full object-cover"
              style={{ userSelect: 'none', WebkitUserSelect: 'none', pointerEvents: 'none', WebkitUserDrag: 'none' } as React.CSSProperties}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center pt-28 pb-12 px-8 text-center">
      <h1 className={`text-3xl mb-2 ${titleClass}`} style={{ color: theme.text }}>{title}</h1>
      {subtitle && <p className="font-sans text-sm leading-relaxed max-w-xs" style={{ color: theme.subtext }}>{subtitle}</p>}
      {formattedDate && <p className="font-sans text-xs mt-2 tracking-wider" style={{ color: theme.subtext }}>{formattedDate}</p>}
    </div>
  )
}
