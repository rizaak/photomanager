'use client'

import { useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  page:       number
  totalPages: number
  total:      number
  pageSize:   number
}

export function GalleryPagination({ page, totalPages, total, pageSize }: Props) {
  const searchParams = useSearchParams()
  const pathname     = usePathname()

  const from = Math.min((page - 1) * pageSize + 1, total)
  const to   = Math.min(page * pageSize, total)

  function pageHref(p: number) {
    const params = new URLSearchParams(searchParams.toString())
    if (p === 1) params.delete('page')
    else params.set('page', String(p))
    const qs = params.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  // Page numbers to show: always show first, last, current ±1, with ellipsis
  const pages = buildPageRange(page, totalPages)

  return (
    <div className="flex items-center justify-between pt-8 border-t border-stone-100">
      <p className="text-[11px] font-sans text-stone-400">
        {from}–{to} of {total}
      </p>

      <div className="flex items-center gap-1">
        {/* Prev */}
        {page > 1 ? (
          <Link
            href={pageHref(page - 1)}
            className="flex items-center justify-center w-8 h-8 border border-stone-200 text-stone-500 hover:border-stone-400 hover:text-stone-700 transition-colors"
          >
            <ChevronLeft size={13} strokeWidth={1.5} />
          </Link>
        ) : (
          <span className="flex items-center justify-center w-8 h-8 border border-stone-100 text-stone-300 cursor-default">
            <ChevronLeft size={13} strokeWidth={1.5} />
          </span>
        )}

        {/* Page numbers */}
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="px-1 text-[11px] font-sans text-stone-300">
              …
            </span>
          ) : (
            <Link
              key={p}
              href={pageHref(p as number)}
              className={`flex items-center justify-center w-8 h-8 text-[11px] font-sans border transition-colors ${
                p === page
                  ? 'bg-stone-900 border-stone-900 text-white'
                  : 'border-stone-200 text-stone-500 hover:border-stone-400 hover:text-stone-700'
              }`}
            >
              {p}
            </Link>
          ),
        )}

        {/* Next */}
        {page < totalPages ? (
          <Link
            href={pageHref(page + 1)}
            className="flex items-center justify-center w-8 h-8 border border-stone-200 text-stone-500 hover:border-stone-400 hover:text-stone-700 transition-colors"
          >
            <ChevronRight size={13} strokeWidth={1.5} />
          </Link>
        ) : (
          <span className="flex items-center justify-center w-8 h-8 border border-stone-100 text-stone-300 cursor-default">
            <ChevronRight size={13} strokeWidth={1.5} />
          </span>
        )}
      </div>
    </div>
  )
}

function buildPageRange(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | '…')[] = []
  const add = (p: number) => { if (!pages.includes(p)) pages.push(p) }

  add(1)
  if (current > 3)         pages.push('…')
  if (current > 2)         add(current - 1)
                           add(current)
  if (current < total - 1) add(current + 1)
  if (current < total - 2) pages.push('…')
                           add(total)

  return pages
}
