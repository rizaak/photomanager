'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useTransition } from 'react'
import { Search, X } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: 'active',    label: 'Active'     },
  { value: 'draft',     label: 'Draft'      },
  { value: 'delivered', label: 'Delivered'  },
  { value: 'expired',   label: 'Expired'    },
  { value: 'archived',  label: 'Archived'   },
]

const SORT_OPTIONS = [
  { value: 'newest',   label: 'Newest first'     },
  { value: 'oldest',   label: 'Oldest first'     },
  { value: 'name',     label: 'Name A–Z'         },
  { value: 'active',   label: 'Recently active'  },
  { value: 'selected', label: 'Most selected'    },
]

interface Props {
  allTags: string[]
}

export function GalleryFilterBar({ allTags }: Props) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const searchRef  = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Current values from URL
  const q               = searchParams.get('q') ?? ''
  const sort            = searchParams.get('sort') ?? 'newest'
  const status          = searchParams.get('status') ?? ''
  const tags            = searchParams.get('tags') ?? ''
  const hasSelections   = searchParams.get('hasSelections') === 'true'
  const downloadEnabled = searchParams.get('downloadEnabled') ?? ''

  const activeTagList = tags ? tags.split(',').filter(Boolean) : []

  const hasActiveFilters = !!(q || status || tags || hasSelections || downloadEnabled || sort !== 'newest')

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '') params.delete(key)
        else params.set(key, value)
      }
      // Reset to page 1 when filters change
      if (!('page' in updates)) params.delete('page')
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`)
      })
    },
    [searchParams, pathname, router],
  )

  // Debounced search
  const handleSearch = (value: string) => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      updateParams({ q: value || null })
    }, 350)
  }

  useEffect(() => () => clearTimeout(debounceRef.current), [])

  const clearAll = () => {
    if (searchRef.current) searchRef.current.value = ''
    updateParams({ q: null, status: null, tags: null, hasSelections: null, downloadEnabled: null, sort: null })
  }

  const toggleTag = (tag: string) => {
    const next = activeTagList.includes(tag)
      ? activeTagList.filter((t) => t !== tag)
      : [...activeTagList, tag]
    updateParams({ tags: next.join(',') || null })
  }

  return (
    <div className={`transition-opacity duration-200 ${isPending ? 'opacity-50' : 'opacity-100'}`}>

      {/* Row 1 — search + sort */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative flex-1 min-w-0">
          <Search
            size={12}
            strokeWidth={1.5}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
          />
          <input
            ref={searchRef}
            type="text"
            defaultValue={q}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by gallery or client name…"
            className="w-full pl-9 pr-3 py-2 text-sm font-sans text-stone-700 placeholder-stone-300 bg-white border border-stone-200 focus:outline-none focus:border-stone-400 transition-colors"
          />
        </div>

        {/* Sort */}
        <div className="relative shrink-0">
          <select
            value={sort}
            onChange={(e) =>
              updateParams({ sort: e.target.value === 'newest' ? null : e.target.value })
            }
            className="h-9 pl-3 pr-8 text-[11px] font-sans text-stone-600 bg-white border border-stone-200 focus:outline-none focus:border-stone-400 appearance-none cursor-pointer transition-colors"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <svg
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400"
            width="9" height="5" viewBox="0 0 9 5" fill="currentColor"
          >
            <path d="M0 0l4.5 5L9 0z" />
          </svg>
        </div>
      </div>

      {/* Row 2 — filter chips */}
      <div className="flex items-center flex-wrap gap-1.5">
        {STATUS_OPTIONS.map((opt) => (
          <Chip
            key={opt.value}
            active={status === opt.value}
            onClick={() => updateParams({ status: status === opt.value ? null : opt.value })}
          >
            {opt.label}
          </Chip>
        ))}

        <div className="w-px h-3.5 bg-stone-200 mx-0.5" />

        <Chip
          active={hasSelections}
          onClick={() => updateParams({ hasSelections: hasSelections ? null : 'true' })}
        >
          Has selections
        </Chip>

        <Chip
          active={downloadEnabled === 'true'}
          onClick={() =>
            updateParams({ downloadEnabled: downloadEnabled === 'true' ? null : 'true' })
          }
        >
          Downloads on
        </Chip>

        {allTags.length > 0 && (
          <>
            <div className="w-px h-3.5 bg-stone-200 mx-0.5" />
            {allTags.map((tag) => (
              <Chip
                key={tag}
                active={activeTagList.includes(tag)}
                onClick={() => toggleTag(tag)}
              >
                #{tag}
              </Chip>
            ))}
          </>
        )}

        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="ml-auto flex items-center gap-1 text-[11px] font-sans text-stone-400 hover:text-stone-600 transition-colors"
          >
            <X size={10} strokeWidth={2} />
            Clear
          </button>
        )}
      </div>
    </div>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 text-[11px] font-sans border transition-colors duration-150 ${
        active
          ? 'bg-stone-900 border-stone-900 text-white'
          : 'bg-white border-stone-200 text-stone-500 hover:border-stone-400 hover:text-stone-700'
      }`}
    >
      {children}
    </button>
  )
}
