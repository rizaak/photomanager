'use client'

import { useState } from 'react'
import { FolderOpen, Archive, Trash2, Calendar, Download, UserCheck, Layers, X, ChevronDown } from 'lucide-react'
import type { GalleryFolder } from '@/lib/types'

interface BulkActionBarProps {
  count: number
  folders: GalleryFolder[]
  presets: { id: string; name: string }[]
  onAction: (action: BulkAction) => Promise<void>
  onClear: () => void
}

export type BulkAction =
  | { type: 'moveToFolder';      folderId: string | null }
  | { type: 'updateStatus';      status: string }
  | { type: 'applyPreset';       presetId: string }
  | { type: 'updateExpiry';      expiresAt: string | null }
  | { type: 'toggleDownload';    downloadEnabled: boolean }
  | { type: 'toggleRegistration'; requireClientInfo: boolean }
  | { type: 'delete' }

export function BulkActionBar({ count, folders, presets, onAction, onClear }: BulkActionBarProps) {
  const [busy, setBusy]         = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [expiry, setExpiry]     = useState('')
  const [showExpiry, setShowExpiry] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  async function run(action: BulkAction) {
    setBusy(true)
    setOpenMenu(null)
    try { await onAction(action) }
    finally { setBusy(false) }
  }

  return (
    <div
      className="fixed bottom-6 left-1/2 z-40 flex items-center gap-3 px-4 py-3 shadow-2xl"
      style={{
        transform: 'translateX(-50%)',
        background: '#1c1917',
        border: '1px solid rgba(255,255,255,0.08)',
        minWidth: 480,
      }}
    >
      {/* Count */}
      <span className="text-[11px] font-sans text-stone-400 tabular-nums shrink-0">
        <span className="text-white font-medium">{count}</span> selected
      </span>

      <div className="w-px h-4 bg-stone-700 mx-1 shrink-0" />

      {/* Move to folder */}
      <MenuButton
        label="Move to folder"
        icon={<FolderOpen size={12} strokeWidth={1.75} />}
        open={openMenu === 'folder'}
        onToggle={() => setOpenMenu(openMenu === 'folder' ? null : 'folder')}
        busy={busy}
      >
        <MenuItem onClick={() => run({ type: 'moveToFolder', folderId: null })}>
          No folder
        </MenuItem>
        {folders.map((f) => (
          <MenuItem key={f.id} onClick={() => run({ type: 'moveToFolder', folderId: f.id })}>
            {f.name}
          </MenuItem>
        ))}
        {folders.length === 0 && (
          <p className="px-3 py-2 text-[11px] text-stone-500">No folders yet</p>
        )}
      </MenuButton>

      {/* Status */}
      <MenuButton
        label="Set status"
        icon={<Archive size={12} strokeWidth={1.75} />}
        open={openMenu === 'status'}
        onToggle={() => setOpenMenu(openMenu === 'status' ? null : 'status')}
        busy={busy}
      >
        <MenuItem onClick={() => run({ type: 'updateStatus', status: 'draft' })}>Draft</MenuItem>
        <MenuItem onClick={() => run({ type: 'updateStatus', status: 'active' })}>Active</MenuItem>
        <MenuItem onClick={() => run({ type: 'updateStatus', status: 'archived' })}>Archived</MenuItem>
      </MenuButton>

      {/* Apply preset */}
      {presets.length > 0 && (
        <MenuButton
          label="Apply preset"
          icon={<Layers size={12} strokeWidth={1.75} />}
          open={openMenu === 'preset'}
          onToggle={() => setOpenMenu(openMenu === 'preset' ? null : 'preset')}
          busy={busy}
        >
          {presets.map((p) => (
            <MenuItem key={p.id} onClick={() => run({ type: 'applyPreset', presetId: p.id })}>
              {p.name}
            </MenuItem>
          ))}
        </MenuButton>
      )}

      {/* Set expiry */}
      <div className="relative">
        <BarButton
          onClick={() => { setShowExpiry((v) => !v); setOpenMenu(null) }}
          disabled={busy}
          icon={<Calendar size={12} strokeWidth={1.75} />}
        >
          Expiry
        </BarButton>
        {showExpiry && (
          <div className="absolute bottom-full mb-2 left-0 bg-white border border-stone-200 shadow-xl p-3 z-50 flex items-center gap-2 min-w-max">
            <input
              type="date"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              className="text-xs font-sans text-stone-700 border border-stone-200 px-2 py-1 outline-none focus:border-stone-400"
            />
            <button
              onClick={() => { run({ type: 'updateExpiry', expiresAt: expiry || null }); setShowExpiry(false) }}
              disabled={busy}
              className="text-[11px] font-sans font-medium text-white bg-stone-800 hover:bg-stone-700 px-2.5 py-1 transition-colors disabled:opacity-40"
            >
              Apply
            </button>
            <button onClick={() => setShowExpiry(false)} className="text-stone-400 hover:text-stone-600">
              <X size={13} strokeWidth={1.75} />
            </button>
          </div>
        )}
      </div>

      {/* Downloads */}
      <MenuButton
        label="Downloads"
        icon={<Download size={12} strokeWidth={1.75} />}
        open={openMenu === 'download'}
        onToggle={() => setOpenMenu(openMenu === 'download' ? null : 'download')}
        busy={busy}
      >
        <MenuItem onClick={() => run({ type: 'toggleDownload', downloadEnabled: true })}>Enable</MenuItem>
        <MenuItem onClick={() => run({ type: 'toggleDownload', downloadEnabled: false })}>Disable</MenuItem>
      </MenuButton>

      {/* Registration */}
      <MenuButton
        label="Registration"
        icon={<UserCheck size={12} strokeWidth={1.75} />}
        open={openMenu === 'reg'}
        onToggle={() => setOpenMenu(openMenu === 'reg' ? null : 'reg')}
        busy={busy}
      >
        <MenuItem onClick={() => run({ type: 'toggleRegistration', requireClientInfo: true })}>Require</MenuItem>
        <MenuItem onClick={() => run({ type: 'toggleRegistration', requireClientInfo: false })}>Not required</MenuItem>
      </MenuButton>

      <div className="flex-1" />

      {/* Delete */}
      <div className="relative">
        <BarButton
          onClick={() => setShowDelete(true)}
          disabled={busy}
          icon={<Trash2 size={12} strokeWidth={1.75} />}
          danger
        >
          Delete
        </BarButton>
        {showDelete && (
          <div className="absolute bottom-full mb-2 right-0 bg-white border border-stone-200 shadow-xl p-4 z-50 min-w-max">
            <p className="text-xs font-sans text-stone-700 mb-3">
              Delete <span className="font-medium">{count}</span> {count === 1 ? 'gallery' : 'galleries'}? This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => { run({ type: 'delete' }); setShowDelete(false) }}
                disabled={busy}
                className="text-[11px] font-sans font-medium text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 transition-colors disabled:opacity-40"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDelete(false)}
                className="text-[11px] font-sans text-stone-500 hover:text-stone-700 border border-stone-200 px-2.5 py-1"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Clear selection */}
      <button onClick={onClear} className="text-stone-500 hover:text-stone-300 transition-colors duration-150 ml-1">
        <X size={14} strokeWidth={1.75} />
      </button>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function BarButton({
  onClick, disabled, icon, children, danger = false,
}: {
  onClick: () => void
  disabled?: boolean
  icon: React.ReactNode
  children: React.ReactNode
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-sans transition-colors duration-150 disabled:opacity-40"
      style={{ color: danger ? '#f87171' : '#a8a29e' }}
    >
      {icon}
      {children}
    </button>
  )
}

function MenuButton({
  label, icon, open, onToggle, busy, children,
}: {
  label: string
  icon: React.ReactNode
  open: boolean
  onToggle: () => void
  busy?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="relative">
      <BarButton onClick={onToggle} disabled={busy} icon={icon}>
        {label}
        <ChevronDown size={10} strokeWidth={2} style={{ marginLeft: -2 }} />
      </BarButton>
      {open && (
        <div className="absolute bottom-full mb-2 left-0 bg-white border border-stone-200 shadow-xl z-50 min-w-max py-1">
          {children}
        </div>
      )}
    </div>
  )
}

function MenuItem({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="block w-full text-left px-3 py-2 text-xs font-sans text-stone-700 hover:bg-stone-50 transition-colors"
    >
      {children}
    </button>
  )
}
