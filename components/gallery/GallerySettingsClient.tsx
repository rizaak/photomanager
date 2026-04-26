'use client'

import { useState, useEffect, useCallback } from 'react'
import { Check, Copy, Eye, EyeOff, Trash2 } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

type DownloadType = 'NONE' | 'WATERMARKED' | 'FINAL_EDITED' | 'ORIGINALS' | 'SELECTED_ONLY' | 'FULL_GALLERY'
type GalleryStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED'

interface Settings {
  id:                string
  title:             string
  subtitle:          string | null
  status:            GalleryStatus
  shareToken:        string
  hasPassword:       boolean
  expiresAt:         string | null
  allowSelection:    boolean
  allowFavorites:    boolean
  allowComments:     boolean
  requireClientInfo: boolean
  downloadEnabled:   boolean
  downloadType:      DownloadType
  watermarkEnabled:  boolean
}

// Superset of Settings for PATCH body — includes write-only fields not in the read model
interface SettingsPatch {
  title?:             string
  subtitle?:          string | null
  status?:            GalleryStatus
  expiresAt?:         string | null
  allowSelection?:    boolean
  allowFavorites?:    boolean
  allowComments?:     boolean
  requireClientInfo?: boolean
  downloadEnabled?:   boolean
  downloadType?:      DownloadType
  watermarkEnabled?:  boolean
  password?:          string | null
}

interface Preset {
  id:                string
  name:              string
  isDefault:         boolean
  allowSelection:    boolean
  allowFavorites:    boolean
  allowComments:     boolean
  requireClientInfo: boolean
  downloadEnabled:   boolean
  downloadType:      DownloadType
  watermarkEnabled:  boolean
  expiresInDays:     number | null
  createdAt:         string
}

interface ActivityEvent {
  id:        string
  eventType: string
  metadata:  Record<string, unknown> | null
  createdAt: string
}

type Tab = 'presentation' | 'access' | 'downloads' | 'interaction' | 'protection' | 'activity' | 'presets'

// ── Constants ──────────────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string }[] = [
  { key: 'presentation', label: 'Presentation' },
  { key: 'access',       label: 'Access'        },
  { key: 'downloads',    label: 'Downloads'     },
  { key: 'interaction',  label: 'Interaction'   },
  { key: 'protection',   label: 'Protection'    },
  { key: 'activity',     label: 'Activity'      },
  { key: 'presets',      label: 'Presets'       },
]

const DOWNLOAD_TYPE_LABELS: Record<DownloadType, string> = {
  NONE:          'None',
  WATERMARKED:   'Watermarked preview',
  FINAL_EDITED:  'Final edited images',
  ORIGINALS:     'Original files',
  SELECTED_ONLY: 'Selected photos only',
  FULL_GALLERY:  'Full gallery',
}

const EVENT_LABELS: Record<string, string> = {
  GALLERY_OPENED:      'Gallery opened',
  CLIENT_REGISTERED:   'Client registered',
  PHOTO_SELECTED:      'Photo selected',
  SELECTION_SUBMITTED: 'Selection submitted',
  DOWNLOAD_REQUESTED:  'Download requested',
}

// ── Shared primitives ──────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[10px] font-sans text-stone-400 uppercase tracking-widest mb-1.5">
      {children}
    </label>
  )
}

function TextInput({
  value, onChange, placeholder, type = 'text',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full max-w-sm bg-white border border-stone-200 px-4 py-2.5 text-sm font-sans text-stone-700 focus:outline-none focus:border-stone-400 transition-colors placeholder:text-stone-300"
    />
  )
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex items-center justify-between w-full max-w-sm py-3 border-b border-stone-100 last:border-0 group"
    >
      <span className="text-sm font-sans text-stone-700">{label}</span>
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border transition-colors ${
          value ? 'bg-stone-900 border-stone-900' : 'bg-stone-100 border-stone-200'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            value ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </span>
    </button>
  )
}

function SaveButton({ saving, saved, onClick }: { saving: boolean; saved: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="mt-6 px-4 py-2 text-xs font-sans bg-stone-900 text-white disabled:opacity-40 hover:bg-stone-800 transition-colors flex items-center gap-2"
    >
      {saved ? <Check size={12} strokeWidth={2.5} /> : null}
      {saving ? 'Saving…' : saved ? 'Saved' : 'Save changes'}
    </button>
  )
}

function PlaceholderField({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="mb-5">
      <FieldLabel>{label}</FieldLabel>
      <div className="max-w-sm h-10 bg-stone-50 border border-dashed border-stone-200 flex items-center px-4">
        <span className="text-xs font-sans text-stone-300">{hint}</span>
      </div>
    </div>
  )
}

// ── GallerySettingsClient ──────────────────────────────────────────────────────

interface Props {
  galleryId:       string
  initialSettings: Settings
  initialPresets:  Preset[]
}

export function GallerySettingsClient({ galleryId, initialSettings, initialPresets }: Props) {
  const [tab,      setTab]      = useState<Tab>('presentation')
  const [settings, setSettings] = useState(initialSettings)
  const [presets,  setPresets]  = useState(initialPresets)
  const [events,   setEvents]   = useState<ActivityEvent[]>([])
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)

  // ── Helpers ─────────────────────────────────────────────────────────────────

  async function patchSettings(patch: SettingsPatch) {
    setSaving(true)
    setSaved(false)
    const res = await fetch(`/api/galleries/${galleryId}/settings`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(patch),
    })
    if (res.ok) {
      const updated: Settings = await res.json()
      setSettings(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
    setSaving(false)
  }

  // ── Activity load ────────────────────────────────────────────────────────────

  const loadActivity = useCallback(async () => {
    const res = await fetch(`/api/galleries/${galleryId}/activity`)
    if (res.ok) {
      const data = await res.json()
      setEvents(data.events ?? [])
    }
  }, [galleryId])

  useEffect(() => {
    if (tab === 'activity') loadActivity()
  }, [tab, loadActivity])

  // ── Tab content ─────────────────────────────────────────────────────────────

  function renderPresentation() {
    return (
      <Section title="Presentation" subtitle="How the gallery appears to clients.">
        <div className="mb-5">
          <FieldLabel>Title</FieldLabel>
          <TextInput
            value={settings.title}
            onChange={(v) => setSettings((s) => ({ ...s, title: v }))}
            placeholder="Gallery title"
          />
        </div>
        <div className="mb-5">
          <FieldLabel>Subtitle / Description</FieldLabel>
          <textarea
            value={settings.subtitle ?? ''}
            onChange={(e) => setSettings((s) => ({ ...s, subtitle: e.target.value || null }))}
            placeholder="Optional short description"
            rows={3}
            className="w-full max-w-sm bg-white border border-stone-200 px-4 py-2.5 text-sm font-sans text-stone-700 focus:outline-none focus:border-stone-400 transition-colors placeholder:text-stone-300 resize-none"
          />
        </div>
        <PlaceholderField label="Cover Image"      hint="Coming soon" />
        <PlaceholderField label="Layout Style"     hint="Coming soon" />
        <PlaceholderField label="Color Theme"      hint="Coming soon" />
        <PlaceholderField label="Typography Style" hint="Coming soon" />
        <SaveButton saving={saving} saved={saved} onClick={() => patchSettings({ title: settings.title, subtitle: settings.subtitle })} />
      </Section>
    )
  }

  function renderAccess() {
    return (
      <Section title="Access" subtitle="Control who can view this gallery.">
        <div className="mb-5">
          <FieldLabel>Status</FieldLabel>
          <div className="flex gap-2 max-w-sm">
            {(['DRAFT', 'ACTIVE', 'ARCHIVED'] as GalleryStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => setSettings((prev) => ({ ...prev, status: s }))}
                className={`flex-1 py-2 text-xs font-sans border transition-colors ${
                  settings.status === s
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'text-stone-600 border-stone-200 hover:border-stone-400'
                }`}
              >
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <FieldLabel>Share Link</FieldLabel>
          <ShareTokenField token={settings.shareToken} />
        </div>

        <div className="mb-5">
          <FieldLabel>Password</FieldLabel>
          <PasswordField
            hasPassword={settings.hasPassword}
            onSave={(pwd) => patchSettings({ password: pwd })}
            onClear={() => patchSettings({ password: null })}
          />
        </div>

        <div className="mb-5">
          <FieldLabel>Expiration Date</FieldLabel>
          <input
            type="date"
            value={settings.expiresAt ? settings.expiresAt.split('T')[0] : ''}
            onChange={(e) =>
              setSettings((s) => ({ ...s, expiresAt: e.target.value ? new Date(e.target.value).toISOString() : null }))
            }
            className="bg-white border border-stone-200 px-4 py-2.5 text-sm font-sans text-stone-700 focus:outline-none focus:border-stone-400 transition-colors"
          />
          {settings.expiresAt && (
            <button
              onClick={() => setSettings((s) => ({ ...s, expiresAt: null }))}
              className="ml-3 text-xs font-sans text-stone-400 hover:text-stone-700 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        <SaveButton saving={saving} saved={saved} onClick={() => patchSettings({ status: settings.status, expiresAt: settings.expiresAt ?? null })} />
      </Section>
    )
  }

  function renderDownloads() {
    return (
      <Section title="Downloads" subtitle="Control what clients can download.">
        <div className="mb-6">
          <Toggle
            value={settings.downloadEnabled}
            onChange={(v) => setSettings((s) => ({ ...s, downloadEnabled: v }))}
            label="Enable downloads"
          />
        </div>

        {settings.downloadEnabled && (
          <div className="mb-5">
            <FieldLabel>Allowed Download Type</FieldLabel>
            <div className="max-w-sm space-y-1">
              {(Object.keys(DOWNLOAD_TYPE_LABELS) as DownloadType[]).map((dt) => (
                <button
                  key={dt}
                  onClick={() => setSettings((s) => ({ ...s, downloadType: dt }))}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-sans border transition-colors ${
                    settings.downloadType === dt
                      ? 'border-stone-900 text-stone-900 bg-stone-50'
                      : 'border-stone-200 text-stone-600 hover:border-stone-300'
                  }`}
                >
                  {DOWNLOAD_TYPE_LABELS[dt]}
                  {settings.downloadType === dt && <Check size={13} strokeWidth={2.5} />}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs font-sans text-stone-400 max-w-sm">
              All downloads use signed, time-limited URLs. Original files are never exposed directly.
            </p>
          </div>
        )}

        <SaveButton
          saving={saving}
          saved={saved}
          onClick={() => patchSettings({ downloadEnabled: settings.downloadEnabled, downloadType: settings.downloadType })}
        />
      </Section>
    )
  }

  function renderInteraction() {
    return (
      <Section title="Client Interaction" subtitle="What clients can do inside the gallery.">
        <div className="mb-6 max-w-sm">
          <Toggle value={settings.allowSelection}    onChange={(v) => setSettings((s) => ({ ...s, allowSelection:    v }))} label="Allow photo selection" />
          <Toggle value={settings.allowFavorites}    onChange={(v) => setSettings((s) => ({ ...s, allowFavorites:    v }))} label="Allow favorites" />
          <Toggle value={settings.allowComments}     onChange={(v) => setSettings((s) => ({ ...s, allowComments:     v }))} label="Allow comments" />
          <Toggle value={settings.requireClientInfo} onChange={(v) => setSettings((s) => ({ ...s, requireClientInfo: v }))} label="Require name and email before access" />
        </div>
        <SaveButton
          saving={saving}
          saved={saved}
          onClick={() => patchSettings({
            allowSelection:    settings.allowSelection,
            allowFavorites:    settings.allowFavorites,
            allowComments:     settings.allowComments,
            requireClientInfo: settings.requireClientInfo,
          })}
        />
      </Section>
    )
  }

  function renderProtection() {
    return (
      <Section title="Protection" subtitle="Protect your photos from unauthorized use.">
        <div className="mb-6 max-w-sm">
          <Toggle
            value={settings.watermarkEnabled}
            onChange={(v) => setSettings((s) => ({ ...s, watermarkEnabled: v }))}
            label="Apply watermark to previews"
          />
        </div>
        <PlaceholderField label="Watermark Style" hint="Custom watermark design — coming soon" />
        <div className="mb-5 max-w-sm p-4 bg-stone-50 border border-stone-100">
          <p className="text-xs font-sans text-stone-500 leading-relaxed">
            Original files are never served directly. All previews use signed URLs that expire automatically.
          </p>
        </div>
        <SaveButton saving={saving} saved={saved} onClick={() => patchSettings({ watermarkEnabled: settings.watermarkEnabled })} />
      </Section>
    )
  }

  function renderActivity() {
    return (
      <Section title="Activity" subtitle="Recent activity from clients on this gallery.">
        {events.length === 0 ? (
          <p className="text-sm font-sans text-stone-400">No activity recorded yet.</p>
        ) : (
          <div className="max-w-lg divide-y divide-stone-100">
            {events.map((e) => (
              <div key={e.id} className="flex items-center justify-between py-3">
                <span className="text-sm font-sans text-stone-700">
                  {EVENT_LABELS[e.eventType] ?? e.eventType}
                  {e.metadata != null && 'email' in e.metadata && (
                    <span className="text-stone-400 ml-2 text-xs">— {String((e.metadata as Record<string, unknown>).email)}</span>
                  )}
                  {e.metadata != null && 'photoCount' in e.metadata && (
                    <span className="text-stone-400 ml-2 text-xs">— {String((e.metadata as Record<string, unknown>).photoCount)} photos</span>
                  )}
                </span>
                <span className="text-xs font-sans text-stone-400 shrink-0 ml-4">
                  {new Date(e.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>
    )
  }

  function renderPresets() {
    return (
      <Section title="Presets" subtitle="Save settings as reusable templates for new galleries.">
        <PresetsPanel
          galleryId={galleryId}
          settings={settings}
          presets={presets}
          onPresetsChange={setPresets}
          onApply={(p) => {
            setSettings((s) => ({
              ...s,
              allowSelection:    p.allowSelection,
              allowFavorites:    p.allowFavorites,
              allowComments:     p.allowComments,
              requireClientInfo: p.requireClientInfo,
              downloadEnabled:   p.downloadEnabled,
              downloadType:      p.downloadType,
              watermarkEnabled:  p.watermarkEnabled,
            }))
            patchSettings({
              allowSelection:    p.allowSelection,
              allowFavorites:    p.allowFavorites,
              allowComments:     p.allowComments,
              requireClientInfo: p.requireClientInfo,
              downloadEnabled:   p.downloadEnabled,
              downloadType:      p.downloadType,
              watermarkEnabled:  p.watermarkEnabled,
            })
          }}
        />
      </Section>
    )
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      {/* Sidebar */}
      <nav className="w-44 shrink-0 border-r border-stone-100 pt-8 px-6">
        <ul className="space-y-0.5">
          {TABS.map((t) => (
            <li key={t.key}>
              <button
                onClick={() => setTab(t.key)}
                className={`w-full text-left px-2 py-2 text-sm font-sans transition-colors ${
                  tab === t.key
                    ? 'text-stone-900 font-medium'
                    : 'text-stone-400 hover:text-stone-700'
                }`}
              >
                {t.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Content */}
      <div className="flex-1 px-10 py-8 max-w-2xl">
        {tab === 'presentation' && renderPresentation()}
        {tab === 'access'       && renderAccess()}
        {tab === 'downloads'    && renderDownloads()}
        {tab === 'interaction'  && renderInteraction()}
        {tab === 'protection'   && renderProtection()}
        {tab === 'activity'     && renderActivity()}
        {tab === 'presets'      && renderPresets()}
      </div>
    </div>
  )
}

// ── Section wrapper ────────────────────────────────────────────────────────────

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-7">
        <h2 className="font-serif text-2xl text-stone-900 mb-1">{title}</h2>
        <p className="text-sm font-sans text-stone-400">{subtitle}</p>
      </div>
      {children}
    </div>
  )
}

// ── ShareTokenField ────────────────────────────────────────────────────────────

function ShareTokenField({ token }: { token: string }) {
  const [copied, setCopied] = useState(false)
  const url = typeof window !== 'undefined' ? `${window.location.origin}/gallery/${token}` : `/gallery/${token}`

  function copy() {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-2 max-w-sm">
      <input
        readOnly
        value={url}
        className="flex-1 bg-stone-50 border border-stone-200 px-4 py-2.5 text-xs font-sans text-stone-500 focus:outline-none select-all"
      />
      <button
        onClick={copy}
        className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 border border-stone-200 text-xs font-sans text-stone-600 hover:border-stone-400 transition-colors"
      >
        {copied ? <Check size={12} strokeWidth={2.5} /> : <Copy size={12} strokeWidth={1.5} />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}

// ── PasswordField ──────────────────────────────────────────────────────────────

function PasswordField({
  hasPassword,
  onSave,
  onClear,
}: {
  hasPassword: boolean
  onSave: (pwd: string) => void
  onClear: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [value,   setValue]   = useState('')
  const [show,    setShow]    = useState(false)

  if (!editing) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm font-sans text-stone-500">
          {hasPassword ? '••••••••' : 'No password set'}
        </span>
        <button
          onClick={() => setEditing(true)}
          className="text-xs font-sans text-stone-400 hover:text-stone-700 transition-colors underline underline-offset-2"
        >
          {hasPassword ? 'Change' : 'Add password'}
        </button>
        {hasPassword && (
          <button
            onClick={onClear}
            className="text-xs font-sans text-stone-400 hover:text-red-600 transition-colors"
          >
            Remove
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 max-w-sm">
      <div className="relative flex-1">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="New password"
          className="w-full bg-white border border-stone-200 px-4 py-2.5 pr-10 text-sm font-sans text-stone-700 focus:outline-none focus:border-stone-400 transition-colors"
          autoFocus
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors"
        >
          {show ? <EyeOff size={14} strokeWidth={1.5} /> : <Eye size={14} strokeWidth={1.5} />}
        </button>
      </div>
      <button
        onClick={() => { onSave(value); setEditing(false); setValue('') }}
        disabled={!value.trim()}
        className="px-3 py-2.5 text-xs font-sans bg-stone-900 text-white disabled:opacity-40 hover:bg-stone-800 transition-colors"
      >
        Set
      </button>
      <button
        onClick={() => { setEditing(false); setValue('') }}
        className="px-3 py-2.5 text-xs font-sans text-stone-400 hover:text-stone-700 transition-colors"
      >
        Cancel
      </button>
    </div>
  )
}

// ── PresetsPanel ───────────────────────────────────────────────────────────────

function PresetsPanel({
  galleryId: _galleryId,
  settings,
  presets,
  onPresetsChange,
  onApply,
}: {
  galleryId:       string
  settings:        Settings
  presets:         Preset[]
  onPresetsChange: (p: Preset[]) => void
  onApply:         (p: Preset) => void
}) {
  const [creating,     setCreating]     = useState(false)
  const [newName,      setNewName]      = useState('')
  const [newDefault,   setNewDefault]   = useState(false)
  const [saving,       setSaving]       = useState(false)

  async function handleCreate() {
    if (!newName.trim()) return
    setSaving(true)
    const res = await fetch('/api/presets', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:              newName.trim(),
        isDefault:         newDefault,
        allowSelection:    settings.allowSelection,
        allowFavorites:    settings.allowFavorites,
        allowComments:     settings.allowComments,
        requireClientInfo: settings.requireClientInfo,
        downloadEnabled:   settings.downloadEnabled,
        downloadType:      settings.downloadType,
        watermarkEnabled:  settings.watermarkEnabled,
      }),
    })
    if (res.ok) {
      const preset: Preset = await res.json()
      onPresetsChange(
        newDefault
          ? [preset, ...presets.map((p) => ({ ...p, isDefault: false }))]
          : [...presets, preset],
      )
      setCreating(false)
      setNewName('')
      setNewDefault(false)
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    await fetch(`/api/presets/${id}`, { method: 'DELETE' })
    onPresetsChange(presets.filter((p) => p.id !== id))
  }

  async function handleSetDefault(preset: Preset) {
    const res = await fetch(`/api/presets/${preset.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ isDefault: true }),
    })
    if (res.ok) {
      onPresetsChange(presets.map((p) => ({ ...p, isDefault: p.id === preset.id })))
    }
  }

  return (
    <div>
      {/* Save current settings as preset */}
      <div className="mb-8 max-w-sm">
        {creating ? (
          <div className="border border-stone-200 p-4">
            <p className="text-xs font-sans text-stone-500 mb-3">
              Saves current interaction, download, and protection settings as a preset.
            </p>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Preset name (e.g. Wedding Standard)"
              className="w-full bg-white border border-stone-200 px-4 py-2.5 text-sm font-sans text-stone-700 focus:outline-none focus:border-stone-400 transition-colors mb-3"
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
            />
            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={newDefault}
                onChange={(e) => setNewDefault(e.target.checked)}
                className="rounded border-stone-300"
              />
              <span className="text-xs font-sans text-stone-600">Set as default for new galleries</span>
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || saving}
                className="px-3 py-2 text-xs font-sans bg-stone-900 text-white disabled:opacity-40 hover:bg-stone-800 transition-colors"
              >
                {saving ? 'Saving…' : 'Save preset'}
              </button>
              <button
                onClick={() => { setCreating(false); setNewName('') }}
                className="px-3 py-2 text-xs font-sans text-stone-400 hover:text-stone-700 transition-colors"
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
            + Save current settings as preset
          </button>
        )}
      </div>

      {/* Preset list */}
      {presets.length === 0 ? (
        <p className="text-sm font-sans text-stone-400">No presets yet.</p>
      ) : (
        <div className="max-w-lg divide-y divide-stone-100 border border-stone-100">
          {presets.map((preset) => (
            <div key={preset.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <span className="text-sm font-sans text-stone-800">{preset.name}</span>
                {preset.isDefault && (
                  <span className="ml-2 text-[10px] font-sans uppercase tracking-widest text-stone-400">Default</span>
                )}
                <p className="text-xs font-sans text-stone-400 mt-0.5">
                  {[
                    preset.allowSelection    && 'selection',
                    preset.allowFavorites    && 'favorites',
                    preset.downloadEnabled   && DOWNLOAD_TYPE_LABELS[preset.downloadType].toLowerCase(),
                    preset.watermarkEnabled  && 'watermark',
                  ].filter(Boolean).join(' · ') || 'No features enabled'}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <button
                  onClick={() => onApply(preset)}
                  className="text-xs font-sans text-stone-500 hover:text-stone-900 transition-colors px-2 py-1 border border-stone-200 hover:border-stone-400"
                >
                  Apply
                </button>
                {!preset.isDefault && (
                  <button
                    onClick={() => handleSetDefault(preset)}
                    className="text-xs font-sans text-stone-400 hover:text-stone-700 transition-colors"
                  >
                    Set default
                  </button>
                )}
                <button
                  onClick={() => handleDelete(preset.id)}
                  className="text-stone-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={13} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
