'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Star, UploadCloud, Loader2, Pencil, Copy, Check, KeyRound, X, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

// ── Types ─────────────────────────────────────────────────────────────────────

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

interface ProfileData {
  name:         string
  email:        string
  businessName: string
}

interface SubscriptionData {
  plan:    string
  usedGB:  number
  limitGB: number
  percent: number
}

interface ApiKeyRecord {
  id:               string
  label:            string | null
  defaultGalleryId: string | null
  active:           boolean
  lastUsedAt:       string | null
  createdAt:        string
  defaultGallery:   { title: string } | null
}

interface Props {
  initialTab:              string
  profile:                 ProfileData
  subscription:            SubscriptionData
  initialWatermarkPresets: WatermarkPreset[]
  initialApiKeys:          ApiKeyRecord[]
}

const TABS = [
  { id: 'profile',      label: 'Profile'      },
  { id: 'subscription', label: 'Subscription' },
  { id: 'watermarks',   label: 'Watermarks'   },
  { id: 'api-keys',     label: 'API Keys'     },
  { id: 'danger',       label: 'Danger Zone'  },
]

const POSITION_LABELS: Record<WatermarkPosition, string> = {
  CENTER:       'Center',
  TOP_LEFT:     'Top left',
  TOP_RIGHT:    'Top right',
  BOTTOM_LEFT:  'Bottom left',
  BOTTOM_RIGHT: 'Bottom right',
}

// CSS transform/position for live preview
const POSITION_STYLE: Record<WatermarkPosition, React.CSSProperties> = {
  CENTER:       { top: '50%', left: '50%',  transform: 'translate(-50%, -50%)' },
  TOP_LEFT:     { top: '5%',  left: '5%',   transform: 'none'                  },
  TOP_RIGHT:    { top: '5%',  right: '5%',  transform: 'none'                  },
  BOTTOM_LEFT:  { bottom: '5%', left: '5%', transform: 'none'                  },
  BOTTOM_RIGHT: { bottom: '5%', right: '5%', transform: 'none'                 },
}

// ── SettingsClient ─────────────────────────────────────────────────────────────

export function SettingsClient({ initialTab, profile, subscription, initialWatermarkPresets, initialApiKeys }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(initialTab)

  function switchTab(tab: string) {
    setActiveTab(tab)
    router.replace(`/dashboard/settings?tab=${encodeURIComponent(tab)}`, { scroll: false })
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-stone-200 px-10 h-14 flex items-center">
        <h1 className="font-serif text-lg text-stone-900">Settings</h1>
      </header>

      <div className="px-10 py-8 max-w-3xl">
        {/* Tab bar */}
        <div className="flex gap-0 border-b border-stone-200 mb-10">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => switchTab(id)}
              className={`px-5 py-3 text-sm font-sans transition-colors border-b-2 -mb-px ${
                activeTab === id
                  ? 'text-stone-900 border-stone-900'
                  : 'text-stone-400 border-transparent hover:text-stone-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'profile'      && <ProfileTab      profile={profile}           />}
        {activeTab === 'subscription' && <SubscriptionTab subscription={subscription} />}
        {activeTab === 'watermarks'   && <WatermarksTab   initialPresets={initialWatermarkPresets} />}
        {activeTab === 'api-keys'     && <ApiKeysTab      initialKeys={initialApiKeys} />}
        {activeTab === 'danger'       && <DangerTab />}
      </div>
    </div>
  )
}

// ── Profile tab ───────────────────────────────────────────────────────────────

function ProfileTab({ profile }: { profile: ProfileData }) {
  const [name,         setName]         = useState(profile.name)
  const [businessName, setBusinessName] = useState(profile.businessName)
  const [saving,       setSaving]       = useState(false)
  const [saved,        setSaved]        = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/photographer/profile', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: name.trim(), businessName: businessName.trim() }),
      })
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000) }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <label className="block text-[10px] font-sans text-stone-500 uppercase tracking-widest mb-2">
          Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full max-w-sm bg-white border border-stone-200 px-4 py-3 text-sm font-sans text-stone-700 focus:outline-none focus:border-stone-400"
        />
      </div>
      <div className="mb-6">
        <label className="block text-[10px] font-sans text-stone-500 uppercase tracking-widest mb-2">
          Email
        </label>
        <input
          defaultValue={profile.email}
          disabled
          className="w-full max-w-sm bg-stone-50 border border-stone-200 px-4 py-3 text-sm font-sans text-stone-400 cursor-not-allowed"
        />
        <p className="text-xs text-stone-400 font-sans mt-1.5">Email is managed via your auth provider.</p>
      </div>
      <div className="mb-6">
        <label className="block text-[10px] font-sans text-stone-500 uppercase tracking-widest mb-2">
          Business / Studio Name
        </label>
        <input
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="e.g. Isaac Lopez Photography"
          className="w-full max-w-sm bg-white border border-stone-200 px-4 py-3 text-sm font-sans text-stone-700 focus:outline-none focus:border-stone-400"
        />
      </div>
      <Button variant="secondary" size="sm" onClick={handleSave} disabled={saving}>
        {saved ? 'Saved' : saving ? 'Saving…' : 'Save Changes'}
      </Button>
    </div>
  )
}

// ── Subscription tab ──────────────────────────────────────────────────────────

function SubscriptionTab({ subscription }: { subscription: SubscriptionData }) {
  const plan = subscription.plan.toLowerCase() as 'free' | 'pro' | 'studio'
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Badge variant={plan} />
        <span className="text-sm font-sans text-stone-600">Current plan</span>
      </div>
      <div className="mb-6">
        <div className="flex justify-between text-sm font-sans text-stone-600 mb-2">
          <span>Storage used</span>
          <span>{subscription.usedGB} GB of {subscription.limitGB} GB ({subscription.percent}%)</span>
        </div>
        <div className="h-1.5 bg-stone-100 w-full max-w-sm">
          <div className="h-1.5 bg-accent" style={{ width: `${subscription.percent}%` }} />
        </div>
      </div>
      <Button variant="primary" size="sm">Upgrade Plan</Button>
    </div>
  )
}

// ── Danger tab ────────────────────────────────────────────────────────────────

function DangerTab() {
  return (
    <div>
      <p className="text-sm font-sans text-stone-500 mb-5">
        Deleting your account is permanent and cannot be undone. All galleries and photos will be removed.
      </p>
      <Button variant="danger" size="sm">Delete Account</Button>
    </div>
  )
}

// ── Watermarks tab ────────────────────────────────────────────────────────────

function WatermarksTab({ initialPresets }: { initialPresets: WatermarkPreset[] }) {
  const [presets,    setPresets]    = useState(initialPresets)
  const [formOpen,   setFormOpen]   = useState(false)
  const [editingId,  setEditingId]  = useState<string | null>(null)
  const [uploading,  setUploading]  = useState(false)
  const [saving,     setSaving]     = useState(false)
  const fileRef      = useRef<HTMLInputElement>(null)
  const origImageKey = useRef('')

  // Form state
  const [name,       setName]       = useState('')
  const [imageKey,   setImageKey]   = useState('')
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)
  const [position,   setPosition]   = useState<WatermarkPosition>('BOTTOM_RIGHT')
  const [sizePct,    setSizePct]    = useState(20)
  const [opacity,    setOpacity]    = useState(40)
  const [isDefault,  setIsDefault]  = useState(false)

  function openCreateForm() {
    setEditingId(null)
    setName(''); setImageKey(''); setPreviewSrc(null)
    setPosition('BOTTOM_RIGHT'); setSizePct(20); setOpacity(40); setIsDefault(false)
    origImageKey.current = ''
    setFormOpen(true)
  }

  function openEditForm(preset: WatermarkPreset) {
    setEditingId(preset.id)
    setName(preset.name)
    setImageKey(preset.imageKey)
    setPreviewSrc(preset.previewUrl)
    setPosition(preset.position)
    setSizePct(preset.sizePct)
    setOpacity(preset.opacity)
    setIsDefault(preset.isDefault)
    origImageKey.current = preset.imageKey
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditingId(null)
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

  async function refreshPresets() {
    const res = await fetch('/api/watermarks')
    if (res.ok) { const data = await res.json(); setPresets(data.presets) }
  }

  async function handleSave() {
    if (!name.trim() || !imageKey) return
    setSaving(true)
    try {
      if (editingId) {
        const body: Record<string, unknown> = { name: name.trim(), position, sizePct, opacity, isDefault }
        if (imageKey !== origImageKey.current) body.imageKey = imageKey
        const res = await fetch(`/api/watermarks/${editingId}`, {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(body),
        })
        if (!res.ok) {
          const data = await res.json()
          alert(data.error ?? 'Failed to update preset')
          return
        }
      } else {
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
      }
      await refreshPresets()
      closeForm()
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
    if (res.ok) setPresets((prev) => prev.map((p) => ({ ...p, isDefault: p.id === preset.id })))
  }

  async function handleDelete(preset: WatermarkPreset) {
    if (!confirm(`Delete "${preset.name}"? This cannot be undone.`)) return
    const res = await fetch(`/api/watermarks/${preset.id}`, { method: 'DELETE' })
    if (res.ok || res.status === 204) setPresets((prev) => prev.filter((p) => p.id !== preset.id))
  }

  const isEditing = !!editingId

  return (
    <div>
      <p className="text-sm font-sans text-stone-400 mb-6">
        Watermark images are overlaid on client previews. Assign a preset per gallery in its Protection settings.
      </p>

      {/* Create / Edit form */}
      <div className="mb-8">
        {formOpen ? (
          <div className="border border-stone-200 p-6">
            <h3 className="text-sm font-sans font-medium text-stone-800 mb-6">
              {isEditing ? 'Edit watermark preset' : 'New watermark preset'}
            </h3>

            <div className="flex gap-8">
              {/* Form controls */}
              <div className="flex-1 min-w-0">
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
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-stone-900 flex items-center justify-center shrink-0">
                        <img src={previewSrc} alt="" className="max-w-full max-h-full object-contain" />
                      </div>
                      <button
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        className="text-xs font-sans text-stone-500 underline underline-offset-2 hover:text-stone-800 transition-colors disabled:opacity-50"
                      >
                        {uploading ? 'Uploading…' : 'Replace image'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      className="flex flex-col items-center justify-center gap-2 w-full h-20 border-2 border-dashed border-stone-200 hover:border-stone-400 transition-colors disabled:opacity-50"
                    >
                      {uploading
                        ? <Loader2 size={16} strokeWidth={1.5} className="text-stone-400 animate-spin" />
                        : <UploadCloud size={16} strokeWidth={1.5} className="text-stone-300" />}
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
                    autoFocus={!isEditing}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Studio Logo"
                    className="w-full bg-white border border-stone-200 px-4 py-2.5 text-sm font-sans text-stone-700 focus:outline-none focus:border-stone-400"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
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
                    className="bg-white border border-stone-200 px-4 py-2.5 text-sm font-sans text-stone-700 focus:outline-none focus:border-stone-400"
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

                {/* Future-processing note — only shown in edit mode */}
                {isEditing && (
                  <p className="text-[11px] font-sans text-stone-400 mb-4 leading-relaxed">
                    Changes apply to future processing. Reprocess existing photos separately.
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={!name.trim() || !imageKey || saving}
                    className="px-4 py-2 text-xs font-sans bg-stone-900 text-white disabled:opacity-40 hover:bg-stone-800 transition-colors"
                  >
                    {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Save preset'}
                  </button>
                  <button
                    onClick={closeForm}
                    className="px-4 py-2 text-xs font-sans text-stone-400 hover:text-stone-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              {/* Live preview */}
              <div className="shrink-0 w-64">
                <label className="block text-[10px] font-sans text-stone-400 uppercase tracking-widest mb-2">
                  Preview
                </label>
                <WatermarkLivePreview
                  watermarkSrc={previewSrc}
                  position={position}
                  sizePct={sizePct}
                  opacity={opacity}
                />
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={openCreateForm}
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
              <div className="w-14 h-14 bg-stone-900 flex items-center justify-center shrink-0">
                <img src={preset.previewUrl} alt="" className="max-w-full max-h-full object-contain" />
              </div>
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
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => openEditForm(preset)}
                  title="Edit"
                  className="text-stone-300 hover:text-stone-600 transition-colors"
                >
                  <Pencil size={13} strokeWidth={1.5} />
                </button>
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

// ── WatermarkLivePreview ──────────────────────────────────────────────────────

function WatermarkLivePreview({
  watermarkSrc,
  position,
  sizePct,
  opacity,
}: {
  watermarkSrc: string | null
  position:     WatermarkPosition
  sizePct:      number
  opacity:      number
}) {
  return (
    <div
      className="relative w-full overflow-hidden bg-stone-200"
      style={{ aspectRatio: '3/2' }}
    >
      {/* Sample photo background — a neutral gradient to simulate a photo */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #c9b99a 0%, #e8ddd0 40%, #b5a898 100%)',
        }}
      />

      {/* Simulated photo content */}
      <div className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(circle at 30% 40%, rgba(255,255,255,0.4) 0%, transparent 50%),
            radial-gradient(circle at 70% 70%, rgba(0,0,0,0.2) 0%, transparent 40%)
          `,
        }}
      />

      {/* Watermark overlay */}
      {watermarkSrc ? (
        <div
          className="absolute"
          style={{
            ...POSITION_STYLE[position],
            width: `${sizePct}%`,
          }}
        >
          <img
            src={watermarkSrc}
            alt=""
            className="w-full h-auto object-contain"
            style={{ opacity: opacity / 100 }}
          />
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-sans text-stone-400 uppercase tracking-widest">
            Upload image to preview
          </span>
        </div>
      )}
    </div>
  )
}

// ── API Keys tab ──────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function ApiKeysTab({ initialKeys }: { initialKeys: ApiKeyRecord[] }) {
  const [keys,       setKeys]       = useState(initialKeys)
  const [showCreate, setShowCreate] = useState(false)
  const [revoking,   setRevoking]   = useState<string | null>(null)

  async function handleRevoke(key: ApiKeyRecord) {
    if (!confirm(`Revoke "${key.label || 'Unnamed key'}"? Any plugin using it will stop working immediately.`)) return
    setRevoking(key.id)
    try {
      const res = await fetch(`/api/import/keys/${key.id}`, { method: 'DELETE' })
      if (res.ok) setKeys((prev) => prev.filter((k) => k.id !== key.id))
    } finally {
      setRevoking(null)
    }
  }

  return (
    <div>
      <p className="text-sm font-sans text-stone-400 mb-6">
        API keys let external tools like Lightroom plugins upload photos directly to your account.
        You can specify the target gallery per-upload or set a default on the key.
      </p>

      <button
        onClick={() => setShowCreate(true)}
        className="flex items-center gap-1.5 px-4 py-2 text-xs font-sans border border-stone-300 text-stone-700 hover:border-stone-500 hover:text-stone-900 transition-colors mb-8"
      >
        <KeyRound size={11} strokeWidth={1.5} />
        New API key
      </button>

      {keys.length === 0 ? (
        <p className="text-sm font-sans text-stone-400">
          No API keys yet. Create one to connect Lightroom or other plugins.
        </p>
      ) : (
        <div className="border border-stone-100 divide-y divide-stone-100">
          {/* Header */}
          <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-5 py-2.5 text-[10px] font-sans uppercase tracking-widest text-stone-400">
            <span>Name</span>
            <span>Default gallery</span>
            <span>Created</span>
            <span>Last used</span>
            <span />
          </div>
          {keys.map((key) => (
            <div key={key.id} className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 items-center px-5 py-3.5">
              <span className="text-sm font-sans text-stone-800 truncate">
                {key.label || <span className="text-stone-400 italic">Unnamed</span>}
              </span>
              <span className="text-sm font-sans text-stone-500 truncate">
                {key.defaultGallery ? key.defaultGallery.title : <span className="text-stone-300 italic">None</span>}
              </span>
              <span className="text-xs font-sans text-stone-400 whitespace-nowrap">{fmtDate(key.createdAt)}</span>
              <span className="text-xs font-sans text-stone-400 whitespace-nowrap">
                {key.lastUsedAt ? fmtDate(key.lastUsedAt) : '—'}
              </span>
              <button
                onClick={() => handleRevoke(key)}
                disabled={revoking === key.id}
                title="Revoke key"
                className="text-stone-300 hover:text-red-500 transition-colors disabled:opacity-40"
              >
                {revoking === key.id
                  ? <Loader2 size={13} strokeWidth={1.5} className="animate-spin" />
                  : <Trash2 size={13} strokeWidth={1.5} />}
              </button>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateKeyModal
          onClose={() => setShowCreate(false)}
          onCreated={(newKey) => setKeys((prev) => [...prev, newKey])}
        />
      )}
    </div>
  )
}

// ── CreateKeyModal ─────────────────────────────────────────────────────────────

interface NewKeyResult {
  id:               string
  label:            string | null
  defaultGalleryId: string | null
  active:           true
  lastUsedAt:       null
  createdAt:        string
  key:              string  // plaintext — only present right after creation
}

function CreateKeyModal({
  onClose,
  onCreated,
}: {
  onClose:   () => void
  onCreated: (key: ApiKeyRecord) => void
}) {
  type Phase = 'form' | 'revealed'
  const [phase,      setPhase]      = useState<Phase>('form')
  const [label,           setLabel]           = useState('')
  const [defaultGalleryId, setDefaultGalleryId] = useState('')
  const [galleries,       setGalleries]       = useState<{ id: string; title: string }[]>([])
  const [loadingGal,      setLoadingGal]      = useState(true)
  const [creating,        setCreating]        = useState(false)
  const [error,           setError]           = useState<string | null>(null)
  const [revealedKey,     setRevealedKey]     = useState('')
  const [copied,          setCopied]          = useState(false)

  useEffect(() => {
    fetch('/api/galleries?limit=200')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.galleries) setGalleries(data.galleries.map((g: { id: string; title: string }) => ({ id: g.id, title: g.title })))
      })
      .catch(() => {})
      .finally(() => setLoadingGal(false))
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError(null)
    try {
      const res = await fetch('/api/import/keys', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          defaultGalleryId: defaultGalleryId || undefined,
          label:            label.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to create key')
      }
      const data: NewKeyResult = await res.json()
      setRevealedKey(data.key)
      setPhase('revealed')
      onCreated({
        id:               data.id,
        label:            data.label,
        defaultGalleryId: data.defaultGalleryId,
        active:           true,
        lastUsedAt:       null,
        createdAt:        data.createdAt,
        defaultGallery:   data.defaultGalleryId
          ? (galleries.find((g) => g.id === data.defaultGalleryId) ?? null)
          : null,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setCreating(false)
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(revealedKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard not available */
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="relative bg-white w-full max-w-md mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <p className="text-sm font-sans font-medium text-stone-800">
            {phase === 'form' ? 'New API key' : 'API key created'}
          </p>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 transition-colors">
            <X size={15} strokeWidth={1.5} />
          </button>
        </div>

        {phase === 'form' ? (
          <form onSubmit={handleCreate} className="px-6 py-5 space-y-5">
            {/* Name */}
            <div>
              <label className="block text-[10px] font-sans uppercase tracking-widest text-stone-400 mb-1.5">
                Name <span className="normal-case tracking-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Lightroom plugin"
                autoFocus
                className="w-full px-4 py-2.5 text-sm font-sans text-stone-800 border border-stone-200 focus:outline-none focus:border-stone-400 transition-colors"
              />
            </div>

            {/* Default gallery (optional) */}
            <div>
              <label className="block text-[10px] font-sans uppercase tracking-widest text-stone-400 mb-1.5">
                Default gallery <span className="normal-case tracking-normal">(optional)</span>
              </label>
              {loadingGal ? (
                <div className="flex items-center gap-2 text-xs font-sans text-stone-400 py-2">
                  <Loader2 size={12} strokeWidth={1.5} className="animate-spin" />
                  Loading galleries…
                </div>
              ) : (
                <select
                  value={defaultGalleryId}
                  onChange={(e) => setDefaultGalleryId(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm font-sans text-stone-700 border border-stone-200 bg-white focus:outline-none focus:border-stone-400 transition-colors"
                >
                  <option value="">No default — specify per upload</option>
                  {galleries.map((g) => (
                    <option key={g.id} value={g.id}>{g.title}</option>
                  ))}
                </select>
              )}
              <p className="text-[11px] font-sans text-stone-400 mt-1.5">
                Used when an upload doesn&apos;t specify a gallery. You can always pass gallery_id or gallery_name per request.
              </p>
            </div>

            {error && (
              <p className="text-xs font-sans text-red-500">{error}</p>
            )}

            <button
              type="submit"
              disabled={creating}
              className="w-full py-2.5 text-sm font-sans bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {creating
                ? <span className="flex items-center justify-center gap-2"><Loader2 size={13} strokeWidth={1.5} className="animate-spin" /> Creating…</span>
                : 'Create API key'}
            </button>
          </form>
        ) : (
          <div className="px-6 py-5 space-y-5">
            {/* Warning banner */}
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 px-4 py-3">
              <AlertTriangle size={14} strokeWidth={1.5} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs font-sans text-amber-700 leading-relaxed">
                Copy this key now. It won&apos;t be shown again. Treat it like a password — anyone with this key can upload photos to your account.
              </p>
            </div>

            {/* Key display + copy */}
            <div>
              <label className="block text-[10px] font-sans uppercase tracking-widest text-stone-400 mb-1.5">
                API Key
              </label>
              <div className="flex items-stretch border border-stone-200">
                <code className="flex-1 px-3 py-2.5 text-xs font-mono text-stone-700 bg-stone-50 break-all leading-relaxed">
                  {revealedKey}
                </code>
                <button
                  onClick={handleCopy}
                  title="Copy to clipboard"
                  className={`px-3 shrink-0 border-l border-stone-200 transition-colors ${
                    copied
                      ? 'text-emerald-600 bg-emerald-50'
                      : 'text-stone-400 hover:text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  {copied
                    ? <Check size={14} strokeWidth={2} />
                    : <Copy size={14} strokeWidth={1.5} />}
                </button>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 text-sm font-sans bg-stone-900 text-white hover:bg-stone-800 transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
