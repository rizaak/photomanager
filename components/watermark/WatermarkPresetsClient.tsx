'use client'

import { useState, useRef } from 'react'
import { Trash2, Star, UploadCloud, Loader2 } from 'lucide-react'

type WatermarkPosition = 'CENTER' | 'TOP_LEFT' | 'TOP_RIGHT' | 'BOTTOM_LEFT' | 'BOTTOM_RIGHT'

interface WatermarkPreset {
  id:         string
  name:       string
  imageKey:   string
  position:   WatermarkPosition
  sizePct:    number
  opacity:    number
  isDefault:  boolean
  isActive:   boolean
  previewUrl: string
  createdAt:  string
  updatedAt:  string
}

const POSITION_LABELS: Record<WatermarkPosition, string> = {
  CENTER:       'Center',
  TOP_LEFT:     'Top left',
  TOP_RIGHT:    'Top right',
  BOTTOM_LEFT:  'Bottom left',
  BOTTOM_RIGHT: 'Bottom right',
}

interface Props {
  initialPresets: WatermarkPreset[]
}

export function WatermarkPresetsClient({ initialPresets }: Props) {
  const [presets,   setPresets]   = useState(initialPresets)
  const [creating,  setCreating]  = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // New preset form state
  const [name,      setName]      = useState('')
  const [imageKey,  setImageKey]  = useState('')
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)
  const [position,  setPosition]  = useState<WatermarkPosition>('CENTER')
  const [sizePct,   setSizePct]   = useState(20)
  const [opacity,   setOpacity]   = useState(40)
  const [isDefault, setIsDefault] = useState(false)

  function resetForm() {
    setName(''); setImageKey(''); setPreviewSrc(null)
    setPosition('CENTER'); setSizePct(20); setOpacity(40); setIsDefault(false)
    setCreating(false)
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/watermarks/image', { method: 'POST', body: form })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error ?? 'Upload failed')
        return
      }
      const { key } = await res.json()
      setImageKey(key)
      setPreviewSrc(URL.createObjectURL(file))
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleCreate() {
    if (!name.trim() || !imageKey) return
    setSaving(true)
    try {
      const res = await fetch('/api/watermarks', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: name.trim(), imageKey, position, sizePct, opacity, isDefault }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error ?? 'Failed to create preset')
        return
      }
      const created: WatermarkPreset = await res.json()
      // We need the previewUrl — re-fetch list to get signed URLs
      const listRes = await fetch('/api/watermarks')
      if (listRes.ok) {
        const data = await listRes.json()
        setPresets(data.presets)
      } else {
        setPresets((prev) => [
          ...(isDefault ? prev.map((p) => ({ ...p, isDefault: false })) : prev),
          { ...created, previewUrl: previewSrc ?? '' },
        ])
      }
      resetForm()
    } finally {
      setSaving(false)
    }
  }

  async function handleSetDefault(preset: WatermarkPreset) {
    const res = await fetch(`/api/watermarks/${preset.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ isDefault: true }),
    })
    if (res.ok) {
      setPresets((prev) => prev.map((p) => ({ ...p, isDefault: p.id === preset.id })))
    }
  }

  async function handleDelete(preset: WatermarkPreset) {
    if (!confirm(`Delete "${preset.name}"? This cannot be undone.`)) return
    const res = await fetch(`/api/watermarks/${preset.id}`, { method: 'DELETE' })
    if (res.ok || res.status === 204) {
      setPresets((prev) => prev.filter((p) => p.id !== preset.id))
    }
  }

  return (
    <div>
      {/* Create form */}
      <div className="mb-8">
        {creating ? (
          <div className="border border-stone-200 p-6 max-w-lg">
            <h3 className="text-sm font-sans font-medium text-stone-800 mb-5">New watermark preset</h3>

            {/* Image upload */}
            <div className="mb-5">
              <label className="block text-[10px] font-sans text-stone-400 uppercase tracking-widest mb-2">
                Watermark Image
              </label>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="sr-only"
                onChange={handleFileChange}
              />
              {previewSrc ? (
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-stone-900 flex items-center justify-center shrink-0">
                    <img src={previewSrc} alt="" className="max-w-full max-h-full object-contain" />
                  </div>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="text-xs font-sans text-stone-500 underline underline-offset-2 hover:text-stone-800 transition-colors"
                  >
                    Change image
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex flex-col items-center justify-center gap-2 w-full h-24 border-2 border-dashed border-stone-200 hover:border-stone-400 transition-colors disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 size={18} strokeWidth={1.5} className="text-stone-400 animate-spin" />
                  ) : (
                    <UploadCloud size={18} strokeWidth={1.5} className="text-stone-300" />
                  )}
                  <span className="text-xs font-sans text-stone-400">
                    {uploading ? 'Uploading…' : 'Click to upload PNG, SVG, WebP'}
                  </span>
                </button>
              )}
            </div>

            {/* Name */}
            <div className="mb-4">
              <label className="block text-[10px] font-sans text-stone-400 uppercase tracking-widest mb-1.5">
                Name
              </label>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Studio Logo"
                className="w-full bg-white border border-stone-200 px-4 py-2.5 text-sm font-sans text-stone-700 focus:outline-none focus:border-stone-400 transition-colors"
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
              />
            </div>

            {/* Position */}
            <div className="mb-4">
              <label className="block text-[10px] font-sans text-stone-400 uppercase tracking-widest mb-1.5">
                Position
              </label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value as WatermarkPosition)}
                className="bg-white border border-stone-200 px-4 py-2.5 text-sm font-sans text-stone-700 focus:outline-none focus:border-stone-400 transition-colors"
              >
                {(Object.keys(POSITION_LABELS) as WatermarkPosition[]).map((p) => (
                  <option key={p} value={p}>{POSITION_LABELS[p]}</option>
                ))}
              </select>
            </div>

            {/* Size */}
            <div className="mb-4">
              <label className="block text-[10px] font-sans text-stone-400 uppercase tracking-widest mb-1.5">
                Size — {sizePct}% of image width
              </label>
              <input
                type="range" min={5} max={60} step={5}
                value={sizePct}
                onChange={(e) => setSizePct(Number(e.target.value))}
                className="w-full max-w-xs accent-stone-800"
              />
            </div>

            {/* Opacity */}
            <div className="mb-5">
              <label className="block text-[10px] font-sans text-stone-400 uppercase tracking-widest mb-1.5">
                Opacity — {opacity}%
              </label>
              <input
                type="range" min={5} max={100} step={5}
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-full max-w-xs accent-stone-800"
              />
            </div>

            {/* Default */}
            <label className="flex items-center gap-2 mb-5 cursor-pointer">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded border-stone-300"
              />
              <span className="text-xs font-sans text-stone-600">Set as default for all galleries</span>
            </label>

            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={!name.trim() || !imageKey || saving}
                className="px-4 py-2 text-xs font-sans bg-stone-900 text-white disabled:opacity-40 hover:bg-stone-800 transition-colors"
              >
                {saving ? 'Saving…' : 'Save preset'}
              </button>
              <button
                onClick={resetForm}
                className="px-4 py-2 text-xs font-sans text-stone-400 hover:text-stone-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="px-4 py-2 text-xs font-sans border border-stone-300 text-stone-700 hover:border-stone-500 transition-colors"
          >
            + Add watermark preset
          </button>
        )}
      </div>

      {/* Preset list */}
      {presets.length === 0 ? (
        <p className="text-sm font-sans text-stone-400">No watermark presets yet.</p>
      ) : (
        <div className="divide-y divide-stone-100 border border-stone-100">
          {presets.map((preset) => (
            <div key={preset.id} className="flex items-center gap-5 px-5 py-4">
              {/* Preview */}
              <div className="w-14 h-14 bg-stone-900 flex items-center justify-center shrink-0">
                <img
                  src={preset.previewUrl}
                  alt=""
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-sans text-stone-800 font-medium">{preset.name}</span>
                  {preset.isDefault && (
                    <span className="text-[10px] font-sans uppercase tracking-widest text-stone-400">Default</span>
                  )}
                </div>
                <p className="text-xs font-sans text-stone-400">
                  {POSITION_LABELS[preset.position]} · {preset.sizePct}% size · {preset.opacity}% opacity
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 shrink-0">
                {!preset.isDefault && (
                  <button
                    onClick={() => handleSetDefault(preset)}
                    title="Set as default"
                    className="text-stone-300 hover:text-stone-600 transition-colors"
                  >
                    <Star size={14} strokeWidth={1.5} />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(preset)}
                  title="Delete"
                  className="text-stone-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
