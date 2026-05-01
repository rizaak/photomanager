'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ExternalLink, Link2, Mail, FolderOpen, Pencil, Copy,
  Archive, ArchiveRestore, Trash2, MoreHorizontal, ChevronRight, X, Check,
} from 'lucide-react'
import type { Gallery, GalleryFolder } from '@/lib/types'

interface GalleryCardMenuProps {
  gallery: Gallery
  folders: GalleryFolder[]
  onTitleChange?: (newTitle: string) => void
}

// ── Inline rename input ───────────────────────────────────────────────────────
function RenameInput({
  initialValue,
  onSave,
  onCancel,
}: {
  initialValue: string
  onSave: (v: string) => void
  onCancel: () => void
}) {
  const [value, setValue] = useState(initialValue)
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => { ref.current?.select() }, [])

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.35)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="bg-white shadow-2xl p-5 w-80">
        <p className="text-xs font-sans text-stone-500 mb-2">Rename gallery</p>
        <input
          ref={ref}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && value.trim()) onSave(value.trim())
            if (e.key === 'Escape') onCancel()
          }}
          className="w-full text-sm font-sans text-stone-800 border border-stone-300 px-3 py-2 outline-none focus:border-stone-500"
        />
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => value.trim() && onSave(value.trim())}
            disabled={!value.trim()}
            className="flex-1 text-[11px] font-sans font-medium text-white bg-stone-800 hover:bg-stone-700 py-1.5 transition-colors disabled:opacity-40"
          >
            Save
          </button>
          <button
            onClick={onCancel}
            className="flex-1 text-[11px] font-sans text-stone-500 hover:text-stone-700 border border-stone-200 py-1.5"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Delete confirmation ───────────────────────────────────────────────────────
function DeleteConfirm({
  title,
  onConfirm,
  onCancel,
}: {
  title: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.35)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="bg-white shadow-2xl p-5 w-80">
        <p className="text-sm font-sans text-stone-800 mb-1 font-medium">Delete gallery?</p>
        <p className="text-xs font-sans text-stone-500 mb-4">
          <span className="font-medium text-stone-700">{title}</span> and all its photos will be permanently deleted. This cannot be undone.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            className="flex-1 text-[11px] font-sans font-medium text-white bg-red-500 hover:bg-red-600 py-1.5 transition-colors"
          >
            Delete gallery
          </button>
          <button
            onClick={onCancel}
            className="flex-1 text-[11px] font-sans text-stone-500 hover:text-stone-700 border border-stone-200 py-1.5"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Send/share dialog ─────────────────────────────────────────────────────────
function SendDialog({
  shareUrl,
  onClose,
}: {
  shareUrl: string
  onClose: () => void
}) {
  const [email, setEmail] = useState('')
  const [sent,  setSent]  = useState(false)

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.35)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white shadow-2xl p-5 w-80">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-sans text-stone-800 font-medium">Share gallery</p>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X size={14} strokeWidth={1.75} />
          </button>
        </div>

        <div className="bg-stone-50 border border-stone-200 px-3 py-2 mb-4">
          <p className="text-[10px] font-sans text-stone-400 mb-0.5">Gallery link</p>
          <p className="text-xs font-sans text-stone-600 truncate">{shareUrl}</p>
        </div>

        {sent ? (
          <div className="flex items-center gap-2 text-emerald-600 text-xs font-sans py-2">
            <Check size={13} strokeWidth={2} />
            Link copied — paste it in your email to the client
          </div>
        ) : (
          <>
            <p className="text-[11px] font-sans text-stone-400 mb-2">
              Email integration coming soon. Copy the link below to send manually.
            </p>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@example.com"
              type="email"
              className="w-full text-xs font-sans text-stone-700 border border-stone-200 px-3 py-2 outline-none focus:border-stone-400 mb-3 placeholder:text-stone-300"
            />
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(shareUrl)
                setSent(true)
              }}
              className="w-full text-[11px] font-sans font-medium text-white bg-stone-800 hover:bg-stone-700 py-1.5 transition-colors"
            >
              Copy link
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── Main menu ─────────────────────────────────────────────────────────────────
export function GalleryCardMenu({ gallery, folders, onTitleChange }: GalleryCardMenuProps) {
  const router = useRouter()

  const [open,        setOpen]        = useState(false)
  const [showFolders, setShowFolders] = useState(false)
  const [modal,       setModal]       = useState<'rename' | 'delete' | 'send' | null>(null)
  const [copied,      setCopied]      = useState(false)
  const [busy,        setBusy]        = useState(false)

  const menuRef = useRef<HTMLDivElement>(null)

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/gallery/${gallery.shareToken}`
      : `/gallery/${gallery.shareToken}`

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
        setShowFolders(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') { setOpen(false); setShowFolders(false) } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  function close() { setOpen(false); setShowFolders(false) }

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    close()
    setTimeout(() => setCopied(false), 2000)
  }

  async function rename(newTitle: string) {
    setModal(null)
    const res = await fetch(`/api/galleries/${gallery.id}/settings`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ title: newTitle }),
    })
    if (res.ok) {
      onTitleChange?.(newTitle)
      router.refresh()
    }
  }

  async function setStatus(status: 'ACTIVE' | 'ARCHIVED' | 'DRAFT') {
    close()
    await fetch(`/api/galleries/${gallery.id}/settings`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status }),
    })
    router.refresh()
  }

  async function moveToFolder(folderId: string | null) {
    close()
    await fetch('/api/galleries/bulk', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ galleryIds: [gallery.id], action: { type: 'moveToFolder', folderId } }),
    })
    router.refresh()
  }

  async function duplicate() {
    close()
    setBusy(true)
    try {
      const res = await fetch(`/api/galleries/${gallery.id}/duplicate`, { method: 'POST' })
      if (res.ok) router.refresh()
    } finally { setBusy(false) }
  }

  async function deleteGallery() {
    setModal(null)
    await fetch(`/api/galleries/${gallery.id}`, { method: 'DELETE' })
    router.refresh()
  }

  const isArchived = gallery.status === 'archived'

  return (
    <>
      {/* ⋯ trigger */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((v) => !v) }}
          className="w-7 h-7 flex items-center justify-center rounded transition-colors duration-150"
          style={{ color: open ? '#1c1917' : '#a8a29e' }}
          aria-label="Gallery actions"
        >
          <MoreHorizontal size={15} strokeWidth={1.75} />
        </button>

        {/* Copied toast */}
        {copied && (
          <div
            className="absolute right-0 bottom-full mb-1.5 px-2.5 py-1 text-[10px] font-sans text-white whitespace-nowrap pointer-events-none"
            style={{ background: '#1c1917' }}
          >
            Link copied
          </div>
        )}

        {open && (
          <div
            className="absolute right-0 top-full mt-1 z-50 bg-white shadow-xl border border-stone-150 py-1 min-w-[180px]"
            style={{ border: '1px solid #e7e5e4' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Open */}
            <Item icon={<ExternalLink size={12} strokeWidth={1.75} />} onClick={() => { close(); router.push(`/dashboard/gallery/${gallery.id}`) }}>
              Open gallery
            </Item>

            {/* Preview public */}
            <Item icon={<ExternalLink size={12} strokeWidth={1.75} />} onClick={() => { close(); window.open(`/gallery/${gallery.shareToken}`, '_blank') }}>
              Preview public view
            </Item>

            <Divider />

            {/* Copy share link */}
            <Item icon={<Link2 size={12} strokeWidth={1.75} />} onClick={copyLink}>
              Copy share link
            </Item>

            {/* Send */}
            <Item icon={<Mail size={12} strokeWidth={1.75} />} onClick={() => { close(); setModal('send') }}>
              Send to client
            </Item>

            <Divider />

            {/* Move to folder — submenu */}
            <div
              className="relative group/folder"
              onMouseEnter={() => setShowFolders(true)}
              onMouseLeave={() => setShowFolders(false)}
            >
              <Item icon={<FolderOpen size={12} strokeWidth={1.75} />} right={<ChevronRight size={11} strokeWidth={1.75} />}>
                Move to folder
              </Item>
              {showFolders && (
                <div
                  className="absolute left-full top-0 -mt-1 ml-0.5 bg-white shadow-xl py-1 min-w-[160px] z-50"
                  style={{ border: '1px solid #e7e5e4' }}
                >
                  <Item onClick={() => moveToFolder(null)}>No folder</Item>
                  {folders.map((f) => (
                    <Item
                      key={f.id}
                      onClick={() => moveToFolder(f.id)}
                      right={gallery.folderId === f.id ? <Check size={11} strokeWidth={2} className="text-accent" /> : undefined}
                    >
                      {f.name}
                    </Item>
                  ))}
                  {folders.length === 0 && (
                    <p className="px-3 py-2 text-[10px] text-stone-400">No folders yet</p>
                  )}
                </div>
              )}
            </div>

            {/* Rename */}
            <Item icon={<Pencil size={12} strokeWidth={1.75} />} onClick={() => { close(); setModal('rename') }}>
              Rename
            </Item>

            {/* Duplicate settings */}
            <Item icon={<Copy size={12} strokeWidth={1.75} />} onClick={duplicate} disabled={busy}>
              Duplicate settings
            </Item>

            <Divider />

            {/* Archive / Unarchive */}
            {isArchived ? (
              <Item icon={<ArchiveRestore size={12} strokeWidth={1.75} />} onClick={() => setStatus('DRAFT')}>
                Unarchive
              </Item>
            ) : (
              <Item icon={<Archive size={12} strokeWidth={1.75} />} onClick={() => setStatus('ARCHIVED')}>
                Archive
              </Item>
            )}

            {/* Delete */}
            <Item
              icon={<Trash2 size={12} strokeWidth={1.75} />}
              onClick={() => { close(); setModal('delete') }}
              danger
            >
              Delete gallery
            </Item>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal === 'rename' && (
        <RenameInput
          initialValue={gallery.title}
          onSave={rename}
          onCancel={() => setModal(null)}
        />
      )}
      {modal === 'delete' && (
        <DeleteConfirm
          title={gallery.title}
          onConfirm={deleteGallery}
          onCancel={() => setModal(null)}
        />
      )}
      {modal === 'send' && (
        <SendDialog shareUrl={shareUrl} onClose={() => setModal(null)} />
      )}
    </>
  )
}

// ── Row ───────────────────────────────────────────────────────────────────────
function Item({
  icon, right, onClick, children, danger = false, disabled = false,
}: {
  icon?: React.ReactNode
  right?: React.ReactNode
  onClick?: () => void
  children: React.ReactNode
  danger?: boolean
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-sans transition-colors duration-100 disabled:opacity-40"
      style={{ color: danger ? '#ef4444' : '#44403c' }}
      onMouseEnter={(e) => { if (!danger) (e.currentTarget as HTMLButtonElement).style.background = '#fafaf9' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '' }}
    >
      {icon && <span className="shrink-0 opacity-60">{icon}</span>}
      <span className="flex-1 text-left">{children}</span>
      {right && <span className="shrink-0 opacity-60">{right}</span>}
    </button>
  )
}

function Divider() {
  return <div className="my-1 border-t border-stone-100" />
}
