'use client'

import { Check } from 'lucide-react'
import { useState, useRef, useCallback } from 'react'
import type { Photo } from '@/lib/types'

interface PhotoCardProps {
  photo: Photo
  index: number
  onOpen: (index: number) => void
  onToggleSelect: (id: string) => void
  onLongPress: (id: string) => void
  selectable: boolean
  selectionMode: boolean
}

const LONG_PRESS_MS = 430
const DRIFT_PX = 8

export function PhotoCard({
  photo,
  index,
  onOpen,
  onToggleSelect,
  onLongPress,
  selectable,
  selectionMode,
}: PhotoCardProps) {
  const aspectRatio = photo.height / photo.width
  const paddingBottom = `${Math.min(Math.max(aspectRatio * 100, 66), 150)}%`

  const [pulsing, setPulsing] = useState(false)
  const [pressing, setPressing] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const originRef = useRef<{ x: number; y: number } | null>(null)
  const didLongPress = useRef(false)

  const pulse = useCallback(() => {
    setPulsing(true)
    setTimeout(() => setPulsing(false), 380)
  }, [])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!selectable) return
      didLongPress.current = false
      setPressing(true)
      originRef.current = { x: e.clientX, y: e.clientY }
      timerRef.current = setTimeout(() => {
        didLongPress.current = true
        setPressing(false) // compress ends; selectPulse takes over
        pulse()
        onLongPress(photo.id)
      }, LONG_PRESS_MS)
    },
    [selectable, onLongPress, photo.id, pulse],
  )

  const cancelLongPress = useCallback(() => {
    clearTimeout(timerRef.current)
    setPressing(false)
    originRef.current = null
  }, [])

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!originRef.current) return
      const dx = Math.abs(e.clientX - originRef.current.x)
      const dy = Math.abs(e.clientY - originRef.current.y)
      // Scrolling intent — cancel long press without blocking the scroll
      if (dx > DRIFT_PX || dy > DRIFT_PX) cancelLongPress()
    },
    [cancelLongPress],
  )

  const handleClick = useCallback(() => {
    // Long press already fired — swallow the synthetic click that follows
    if (didLongPress.current) {
      didLongPress.current = false
      return
    }
    if (selectionMode) {
      pulse()
      onToggleSelect(photo.id)
    } else {
      onOpen(index)
    }
  }, [selectionMode, onToggleSelect, onOpen, photo.id, index, pulse])

  // Indicator: appears whenever selection mode is active OR photo is selected
  const showIndicator = selectionMode || photo.selected

  return (
    <div
      className="relative group overflow-hidden rounded"
      style={{
        // Priority: pulsing animation > press compress > idle
        // When pulsing, CSS animation overrides inline transform.
        animation: pulsing ? 'selectPulse 380ms cubic-bezier(0.25,0,0.35,1) forwards' : undefined,
        transform: pulsing ? undefined : pressing ? 'scale(0.972)' : 'scale(1)',
        // Compress slowly (over full LONG_PRESS_MS so it arrives just as the action fires),
        // spring back instantly on release.
        transition: pulsing
          ? 'box-shadow 350ms ease'
          : pressing
            ? `transform ${LONG_PRESS_MS}ms ease-in, box-shadow 350ms ease`
            : 'transform 280ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 350ms ease',
        boxShadow: photo.selected
          ? '0 0 0 1px rgba(201,169,110,0.28), 0 0 20px rgba(201,169,110,0.11), 0 4px 16px rgba(0,0,0,0.4)'
          : '0 2px 12px rgba(0,0,0,0.32)',
        cursor: 'pointer',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'manipulation',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={cancelLongPress}
      onPointerCancel={cancelLongPress}
      onContextMenu={(e) => e.preventDefault()}
      onClick={handleClick}
    >
      {/* Photo area */}
      <div className="relative w-full" style={{ paddingBottom }}>
        <div
          className={`absolute inset-0 ${photo.placeholderColor} brightness-[1.05] group-hover:brightness-[1.11]`}
          style={{ transition: 'filter 750ms ease' }}
        />

        {/* Warm wash cross-fades in on select */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: photo.selected ? 1 : 0,
            transition: 'opacity 700ms ease',
            background:
              'linear-gradient(to top, rgba(201,169,110,0.12) 0%, rgba(201,169,110,0.04) 50%, transparent 100%)',
          }}
        />

        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <span className="text-white/[0.04] font-serif text-xl rotate-[-30deg] tracking-[0.25em]">
            FRAME
          </span>
        </div>
      </div>

      {/* Selection indicator — no button, just a floating dot that materialises */}
      {selectable && (
        <div
          className="absolute top-2.5 right-2.5 z-20 w-5 h-5 rounded-full flex items-center justify-center pointer-events-none"
          style={{
            backgroundColor: photo.selected ? '#C9A96E' : 'rgba(8,7,6,0.42)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: photo.selected
              ? '0 0 0 1px rgba(201,169,110,0.5), 0 0 12px rgba(201,169,110,0.38)'
              : '0 0 0 1px rgba(255,255,255,0.14)',
            opacity: showIndicator ? 1 : 0,
            transform: showIndicator ? 'scale(1)' : 'scale(0.5)',
            transition:
              'background-color 350ms ease, box-shadow 350ms ease, opacity 320ms ease, transform 400ms cubic-bezier(0.34,1.56,0.64,1)',
          }}
        >
          <Check
            size={10}
            strokeWidth={2.5}
            className="text-stone-950"
            style={{
              animation: photo.selected
                ? 'checkPop 380ms cubic-bezier(0.34,1.56,0.64,1) forwards'
                : 'none',
              opacity: photo.selected ? 1 : 0,
              transform: photo.selected ? 'scale(1)' : 'scale(0.3)',
              transition: photo.selected
                ? 'none'
                : 'opacity 160ms ease, transform 160ms ease',
            }}
          />
        </div>
      )}
    </div>
  )
}
