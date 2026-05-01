'use client'

import { useState, useEffect, useCallback } from 'react'
import { Check, Copy, Eye, EyeOff, Trash2, X } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

type DownloadType = 'NONE' | 'WATERMARKED' | 'FINAL_EDITED' | 'ORIGINALS' | 'SELECTED_ONLY' | 'FULL_GALLERY'
type GalleryStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED'

type CoverStyle     = 'fullscreen' | 'split' | 'minimal'
type GalleryLayout  = 'masonry' | 'editorial' | 'uniform'
type TypographyStyle = 'serif' | 'modern' | 'minimal'
type ColorTheme     = 'dark' | 'light' | 'warm'

interface Settings {
  id:                 string
  title:              string
  subtitle:           string | null
  eventDate:          string | null
  coverPhotoId:       string | null
  coverStyle:         CoverStyle
  galleryLayout:      GalleryLayout
  typographyStyle:    TypographyStyle
  colorTheme:         ColorTheme
  tags:               string[]
  status:             GalleryStatus
  shareToken:         string
  hasPassword:        boolean
  expiresAt:          string | null
  allowSelection:     boolean
  allowFavorites:     boolean
  allowComments:      boolean
  requireClientInfo:  boolean
  downloadEnabled:    boolean
  downloadType:       DownloadType
  watermarkEnabled:   boolean
  watermarkPresetId:  string | null
}

interface WatermarkPreset {
  id:         string
  name:       string
  position:   string
  sizePct:    number
  opacity:    number
  isDefault:  boolean
  previewUrl: string
}

// Superset of Settings for PATCH body — includes write-only fields not in the read model
interface SettingsPatch {
  title?:             string
  subtitle?:          string | null
  eventDate?:         string | null
  coverPhotoId?:      string | null
  coverStyle?:        CoverStyle
  galleryLayout?:     GalleryLayout
  typographyStyle?:   TypographyStyle
  colorTheme?:        ColorTheme
  tags?:              string[]
  status?:            GalleryStatus
  expiresAt?:         string | null
  allowSelection?:    boolean
  allowFavorites?:    boolean
  allowComments?:     boolean
  requireClientInfo?: boolean
  downloadEnabled?:   boolean
  downloadType?:      DownloadType
  watermarkEnabled?:   boolean
  watermarkPresetId?:  string | null
  password?:           string | null
}

interface GalleryPhoto {
  id:           string
  thumbnailUrl: string | null
  filename:     string
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
  PHOTO_DESELECTED:    'Photo deselected',
  COMMENT_ADDED:       'Comment added',
  SELECTION_SUBMITTED: 'Selection submitted',
  FINAL_UPLOADED:      'Final uploaded',
  FINALS_READY:        'Finals marked ready',
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

function TagsInput({ value, onChange }: { value: string[]; onChange: (tags: string[]) => void }) {
  const [input, setInput] = useState('')

  function addTag() {
    const tag = input.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '')
    if (!tag || value.includes(tag) || value.length >= 20) return
    onChange([...value, tag])
    setInput('')
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() }
    if (e.key === 'Backspace' && !input && value.length > 0) removeTag(value[value.length - 1])
  }

  return (
    <div className="max-w-sm">
      <div className="flex flex-wrap gap-1.5 mb-2">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-stone-100 border border-stone-200 text-[11px] font-sans text-stone-600"
          >
            #{tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-stone-400 hover:text-stone-700 transition-colors"
            >
              <X size={9} strokeWidth={2.5} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder="Add tag, press Enter"
          maxLength={30}
          className="flex-1 bg-white border border-stone-200 px-3 py-2 text-sm font-sans text-stone-700 focus:outline-none focus:border-stone-400 transition-colors placeholder:text-stone-300"
        />
      </div>
      <p className="mt-1.5 text-[10px] font-sans text-stone-300">Press Enter or comma to add. Max 20 tags.</p>
    </div>
  )
}

// ── GallerySettingsClient ──────────────────────────────────────────────────────

interface Props {
  galleryId:              string
  initialSettings:        Settings
  initialPresets:         Preset[]
  initialWatermarkPresets: WatermarkPreset[]
}

export function GallerySettingsClient({ galleryId, initialSettings, initialPresets, initialWatermarkPresets }: Props) {
  const [tab,              setTab]              = useState<Tab>('presentation')
  const [settings,         setSettings]         = useState(initialSettings)
  const [presets,          setPresets]          = useState(initialPresets)
  const [watermarkPresets, setWatermarkPresets] = useState(initialWatermarkPresets)
  const [events,           setEvents]           = useState<ActivityEvent[]>([])
  const [saving,           setSaving]           = useState(false)
  const [saved,            setSaved]            = useState(false)

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
        {/* Title */}
        <div className="mb-5">
          <FieldLabel>Title</FieldLabel>
          <TextInput
            value={settings.title}
            onChange={(v) => setSettings((s) => ({ ...s, title: v }))}
            placeholder="Gallery title"
          />
        </div>

        {/* Subtitle */}
        <div className="mb-5">
          <FieldLabel>Subtitle</FieldLabel>
          <textarea
            value={settings.subtitle ?? ''}
            onChange={(e) => setSettings((s) => ({ ...s, subtitle: e.target.value || null }))}
            placeholder="Optional short description"
            rows={2}
            className="w-full max-w-sm bg-white border border-stone-200 px-4 py-2.5 text-sm font-sans text-stone-700 focus:outline-none focus:border-stone-400 transition-colors placeholder:text-stone-300 resize-none"
          />
        </div>

        {/* Event date */}
        <div className="mb-5">
          <FieldLabel>Event Date</FieldLabel>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={settings.eventDate ?? ''}
              onChange={(e) => setSettings((s) => ({ ...s, eventDate: e.target.value || null }))}
              className="bg-white border border-stone-200 px-4 py-2.5 text-sm font-sans text-stone-700 focus:outline-none focus:border-stone-400 transition-colors"
            />
            {settings.eventDate && (
              <button
                onClick={() => setSettings((s) => ({ ...s, eventDate: null }))}
                className="text-xs font-sans text-stone-400 hover:text-stone-700 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="mb-7">
          <FieldLabel>Tags</FieldLabel>
          <TagsInput
            value={settings.tags}
            onChange={(tags) => setSettings((s) => ({ ...s, tags }))}
          />
        </div>

        <div className="border-t border-stone-100 pt-7 mb-7">
          <h3 className="text-xs font-sans text-stone-400 uppercase tracking-widest mb-5">Cover</h3>

          {/* Cover photo selector */}
          <div className="mb-6">
            <FieldLabel>Cover Photo</FieldLabel>
            <CoverPhotoSelector
              galleryId={galleryId}
              coverPhotoId={settings.coverPhotoId}
              onChange={(id) => setSettings((s) => ({ ...s, coverPhotoId: id }))}
            />
          </div>

          {/* Cover style */}
          <div className="mb-6">
            <FieldLabel>Cover Style</FieldLabel>
            <CoverStylePicker value={settings.coverStyle} onChange={(v) => setSettings((s) => ({ ...s, coverStyle: v as CoverStyle }))} />
          </div>
        </div>

        <div className="border-t border-stone-100 pt-7 mb-7">
          <h3 className="text-xs font-sans text-stone-400 uppercase tracking-widest mb-5">Style</h3>

          {/* Gallery layout */}
          <div className="mb-6">
            <FieldLabel>Gallery Layout</FieldLabel>
            <LayoutPicker value={settings.galleryLayout} onChange={(v) => setSettings((s) => ({ ...s, galleryLayout: v as GalleryLayout }))} />
          </div>

          {/* Color theme */}
          <div className="mb-6">
            <FieldLabel>Color Theme</FieldLabel>
            <ColorThemePicker value={settings.colorTheme} onChange={(v) => setSettings((s) => ({ ...s, colorTheme: v as ColorTheme }))} />
          </div>

          {/* Typography */}
          <div className="mb-6">
            <FieldLabel>Typography</FieldLabel>
            <TypographyPicker value={settings.typographyStyle} onChange={(v) => setSettings((s) => ({ ...s, typographyStyle: v as TypographyStyle }))} />
          </div>
        </div>

        <SaveButton
          saving={saving}
          saved={saved}
          onClick={() => patchSettings({
            title:           settings.title,
            subtitle:        settings.subtitle,
            eventDate:       settings.eventDate,
            coverPhotoId:    settings.coverPhotoId,
            coverStyle:      settings.coverStyle,
            galleryLayout:   settings.galleryLayout,
            typographyStyle: settings.typographyStyle,
            colorTheme:      settings.colorTheme,
            tags:            settings.tags,
          })}
        />
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

        {settings.watermarkEnabled && (
          <div className="mb-6">
            <FieldLabel>Watermark Preset</FieldLabel>
            {watermarkPresets.length === 0 ? (
              <div className="max-w-sm p-4 bg-stone-50 border border-dashed border-stone-200">
                <p className="text-xs font-sans text-stone-400 mb-2">
                  No watermark presets yet. The default FRAME text watermark will be used.
                </p>
                <a
                  href="/dashboard/watermarks"
                  className="text-xs font-sans text-stone-600 underline underline-offset-2 hover:text-stone-900 transition-colors"
                >
                  Manage watermarks →
                </a>
              </div>
            ) : (
              <div className="max-w-sm space-y-1.5">
                <button
                  onClick={() => setSettings((s) => ({ ...s, watermarkPresetId: null }))}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-sans border transition-colors ${
                    !settings.watermarkPresetId
                      ? 'border-stone-900 text-stone-900 bg-stone-50'
                      : 'border-stone-200 text-stone-500 hover:border-stone-300'
                  }`}
                >
                  <span>Default (FRAME text)</span>
                  {!settings.watermarkPresetId && <Check size={13} strokeWidth={2.5} />}
                </button>
                {watermarkPresets.map((wp) => (
                  <button
                    key={wp.id}
                    onClick={() => setSettings((s) => ({ ...s, watermarkPresetId: wp.id }))}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-sans border transition-colors ${
                      settings.watermarkPresetId === wp.id
                        ? 'border-stone-900 text-stone-900 bg-stone-50'
                        : 'border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    <img
                      src={wp.previewUrl}
                      alt=""
                      className="w-8 h-8 object-contain bg-stone-200 shrink-0"
                    />
                    <span className="flex-1 text-left">{wp.name}</span>
                    <span className="text-[10px] font-sans text-stone-400 shrink-0">
                      {wp.sizePct}% · {wp.opacity}% opacity
                    </span>
                    {settings.watermarkPresetId === wp.id && <Check size={13} strokeWidth={2.5} className="shrink-0" />}
                  </button>
                ))}
                <a
                  href="/dashboard/watermarks"
                  className="block mt-2 text-xs font-sans text-stone-400 hover:text-stone-700 transition-colors"
                >
                  Manage watermarks →
                </a>
              </div>
            )}
          </div>
        )}

        <div className="mb-5 max-w-sm p-4 bg-stone-50 border border-stone-100">
          <p className="text-xs font-sans text-stone-500 leading-relaxed">
            Original files are never served directly. All previews use signed URLs that expire automatically.
          </p>
        </div>
        <SaveButton
          saving={saving}
          saved={saved}
          onClick={() => patchSettings({
            watermarkEnabled:  settings.watermarkEnabled,
            watermarkPresetId: settings.watermarkPresetId,
          })}
        />
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

// ── Shared: VisualCard ────────────────────────────────────────────────────────
// A selectable card with a preview area at top, label + description below.

function VisualCard({
  selected,
  onClick,
  preview,
  label,
  description,
}: {
  selected:    boolean
  onClick:     () => void
  preview:     React.ReactNode
  label:       string
  description: string
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex-1 text-left border transition-all duration-150 overflow-hidden ${
        selected
          ? 'border-stone-900 ring-1 ring-stone-900'
          : 'border-stone-200 hover:border-stone-400'
      }`}
    >
      {/* Preview thumbnail */}
      <div className="w-full overflow-hidden" style={{ height: 84 }}>
        {preview}
      </div>

      {/* Label area */}
      <div className={`px-2.5 py-2 border-t ${selected ? 'border-stone-200 bg-stone-50' : 'border-stone-100 bg-white'}`}>
        <span className={`block text-[11px] font-sans font-medium leading-tight ${selected ? 'text-stone-900' : 'text-stone-600'}`}>
          {label}
        </span>
        <span className="block text-[9px] font-sans text-stone-400 leading-tight mt-0.5">
          {description}
        </span>
      </div>

      {/* Selected indicator */}
      {selected && (
        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-stone-900 flex items-center justify-center">
          <Check size={9} strokeWidth={3} className="text-white" />
        </div>
      )}
    </button>
  )
}

// ── CoverStylePicker ──────────────────────────────────────────────────────────

function CoverStylePreview({ style }: { style: string }) {
  if (style === 'fullscreen') {
    return (
      <div className="w-full h-full relative" style={{ backgroundColor: '#44403c' }}>
        {/* Simulated gradient overlay at bottom */}
        <div
          className="absolute inset-x-0 bottom-0"
          style={{ height: '55%', background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%)' }}
        />
        {/* Title lines */}
        <div className="absolute bottom-3 left-3 space-y-1.5">
          <div className="h-[5px] w-14 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.85)' }} />
          <div className="h-[3px] w-10 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.4)' }} />
        </div>
      </div>
    )
  }

  if (style === 'split') {
    return (
      <div className="w-full h-full flex" style={{ backgroundColor: '#faf9f7' }}>
        {/* Left: text content */}
        <div className="w-[46%] flex flex-col justify-center pl-3 gap-2">
          <div className="h-[5px] w-11 rounded-full" style={{ backgroundColor: '#292524' }} />
          <div className="space-y-1">
            <div className="h-[3px] w-9 rounded-full"  style={{ backgroundColor: '#a8a29e' }} />
            <div className="h-[3px] w-6 rounded-full"  style={{ backgroundColor: '#d6d3d1' }} />
          </div>
        </div>
        {/* Right: photo */}
        <div className="flex-1 h-full" style={{ backgroundColor: '#78716c' }} />
      </div>
    )
  }

  // minimal — centered text only
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2" style={{ backgroundColor: '#faf9f7' }}>
      <div className="h-[5px] w-16 rounded-full" style={{ backgroundColor: '#292524' }} />
      <div className="h-[3px] w-11 rounded-full" style={{ backgroundColor: '#a8a29e' }} />
      <div className="h-[3px] w-8  rounded-full" style={{ backgroundColor: '#d6d3d1' }} />
    </div>
  )
}

const COVER_STYLE_OPTIONS: { value: string; label: string; description: string }[] = [
  { value: 'fullscreen', label: 'Fullscreen', description: 'Full-bleed hero with overlay' },
  { value: 'split',      label: 'Split',      description: 'Text left, image right'       },
  { value: 'minimal',    label: 'Minimal',    description: 'Centered text, no image'      },
]

function CoverStylePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2.5" style={{ maxWidth: 480 }}>
      {COVER_STYLE_OPTIONS.map((opt) => (
        <VisualCard
          key={opt.value}
          selected={value === opt.value}
          onClick={() => onChange(opt.value)}
          label={opt.label}
          description={opt.description}
          preview={<CoverStylePreview style={opt.value} />}
        />
      ))}
    </div>
  )
}

// ── LayoutPicker ──────────────────────────────────────────────────────────────

function LayoutPreview({ layout }: { layout: string }) {
  if (layout === 'masonry') {
    // Three columns of uneven-height blocks
    return (
      <div className="w-full h-full p-2 flex gap-1" style={{ backgroundColor: '#f5f5f4' }}>
        <div className="flex-1 flex flex-col gap-1">
          <div className="rounded-[1px]" style={{ backgroundColor: '#c4c0bc', flex: '0 0 45%' }} />
          <div className="rounded-[1px]" style={{ backgroundColor: '#d6d3d1', flex: '0 0 25%' }} />
          <div className="flex-1 rounded-[1px]" style={{ backgroundColor: '#e7e5e4' }} />
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <div className="rounded-[1px]" style={{ backgroundColor: '#e7e5e4', flex: '0 0 20%' }} />
          <div className="rounded-[1px]" style={{ backgroundColor: '#c4c0bc', flex: '0 0 50%' }} />
          <div className="flex-1 rounded-[1px]" style={{ backgroundColor: '#d6d3d1' }} />
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <div className="rounded-[1px]" style={{ backgroundColor: '#d6d3d1', flex: '0 0 35%' }} />
          <div className="rounded-[1px]" style={{ backgroundColor: '#e7e5e4', flex: '0 0 20%' }} />
          <div className="flex-1 rounded-[1px]" style={{ backgroundColor: '#c4c0bc' }} />
        </div>
      </div>
    )
  }

  if (layout === 'editorial') {
    // Wide feature spanning full width, then 2 equal below
    return (
      <div className="w-full h-full p-2 flex flex-col gap-1" style={{ backgroundColor: '#f5f5f4' }}>
        {/* Feature photo: wide */}
        <div className="rounded-[1px]" style={{ backgroundColor: '#a8a29e', flex: '0 0 52%' }} />
        {/* Two equal below */}
        <div className="flex gap-1" style={{ flex: 1 }}>
          <div className="flex-1 rounded-[1px]" style={{ backgroundColor: '#d6d3d1' }} />
          <div className="flex-1 rounded-[1px]" style={{ backgroundColor: '#e7e5e4' }} />
        </div>
      </div>
    )
  }

  // uniform — 3×3 equal squares
  return (
    <div className="w-full h-full p-2 grid grid-cols-3 gap-1" style={{ backgroundColor: '#f5f5f4' }}>
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          className="rounded-[1px]"
          style={{ backgroundColor: i % 2 === 0 ? '#d6d3d1' : '#e7e5e4' }}
        />
      ))}
    </div>
  )
}

const LAYOUT_OPTIONS: { value: string; label: string; description: string }[] = [
  { value: 'masonry',   label: 'Masonry',    description: 'Natural height flow'  },
  { value: 'editorial', label: 'Editorial',  description: 'Feature + grid rows'  },
  { value: 'uniform',   label: 'Uniform',    description: 'Equal square grid'    },
]

function LayoutPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2.5" style={{ maxWidth: 480 }}>
      {LAYOUT_OPTIONS.map((opt) => (
        <VisualCard
          key={opt.value}
          selected={value === opt.value}
          onClick={() => onChange(opt.value)}
          label={opt.label}
          description={opt.description}
          preview={<LayoutPreview layout={opt.value} />}
        />
      ))}
    </div>
  )
}

// ── ColorThemePicker ──────────────────────────────────────────────────────────

const COLOR_THEME_OPTIONS: { value: string; label: string; description: string; bg: string; text: string; accent: string }[] = [
  { value: 'dark',  label: 'Dark',  description: 'Deep charcoal', bg: '#1C1917', text: '#d6d3d1', accent: '#C9A96E' },
  { value: 'light', label: 'Light', description: 'Clean white',   bg: '#F7F5F2', text: '#292524', accent: '#78716c' },
  { value: 'warm',  label: 'Warm',  description: 'Warm amber',    bg: '#181210', text: '#d6c5b0', accent: '#C9A96E' },
]

function ColorThemePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2.5" style={{ maxWidth: 480 }}>
      {COLOR_THEME_OPTIONS.map((opt) => (
        <VisualCard
          key={opt.value}
          selected={value === opt.value}
          onClick={() => onChange(opt.value)}
          label={opt.label}
          description={opt.description}
          preview={
            <div className="w-full h-full flex flex-col justify-between p-3" style={{ backgroundColor: opt.bg }}>
              {/* Simulated title */}
              <div className="h-[5px] w-12 rounded-full" style={{ backgroundColor: opt.text, opacity: 0.9 }} />
              {/* Simulated photo blocks */}
              <div className="flex gap-1">
                <div className="flex-1 rounded-[1px]" style={{ backgroundColor: opt.text, opacity: 0.18, height: 28 }} />
                <div className="flex-1 rounded-[1px]" style={{ backgroundColor: opt.text, opacity: 0.13, height: 28 }} />
                <div className="flex-1 rounded-[1px]" style={{ backgroundColor: opt.text, opacity: 0.18, height: 28 }} />
              </div>
              {/* Accent line */}
              <div className="h-[2px] w-6 rounded-full" style={{ backgroundColor: opt.accent }} />
            </div>
          }
        />
      ))}
    </div>
  )
}

// ── TypographyPicker ──────────────────────────────────────────────────────────

const TYPOGRAPHY_OPTIONS: { value: string; label: string; description: string; sample: string; className: string }[] = [
  { value: 'serif',   label: 'Serif',   description: 'Editorial elegance',  sample: 'Gallery',  className: 'font-serif text-xl text-stone-800 leading-none' },
  { value: 'modern',  label: 'Modern',  description: 'Light & airy',         sample: 'GALLERY', className: 'font-sans text-[10px] tracking-[0.25em] font-light text-stone-800 leading-none' },
  { value: 'minimal', label: 'Minimal', description: 'Precise & structured', sample: 'GALLERY', className: 'font-sans text-[9px] tracking-[0.18em] font-semibold text-stone-800 leading-none' },
]

function TypographyPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2.5" style={{ maxWidth: 480 }}>
      {TYPOGRAPHY_OPTIONS.map((opt) => (
        <VisualCard
          key={opt.value}
          selected={value === opt.value}
          onClick={() => onChange(opt.value)}
          label={opt.label}
          description={opt.description}
          preview={
            <div className="w-full h-full flex flex-col items-center justify-center gap-3" style={{ backgroundColor: '#faf9f7' }}>
              <span className={opt.className}>{opt.sample}</span>
              <div className="h-px w-8" style={{ backgroundColor: '#d6d3d1' }} />
              <div className="h-[3px] w-14 rounded-full" style={{ backgroundColor: '#e7e5e4' }} />
            </div>
          }
        />
      ))}
    </div>
  )
}

// ── CoverPhotoSelector ────────────────────────────────────────────────────────

function CoverPhotoSelector({
  galleryId,
  coverPhotoId,
  onChange,
}: {
  galleryId:    string
  coverPhotoId: string | null
  onChange:     (id: string | null) => void
}) {
  const [open,   setOpen]   = useState(false)
  const [photos, setPhotos] = useState<GalleryPhoto[]>([])
  const [loading, setLoading] = useState(false)

  async function loadPhotos() {
    if (photos.length > 0) { setOpen(true); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/galleries/${galleryId}/photos`)
      if (!res.ok) return
      const data = await res.json()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const all: GalleryPhoto[] = [
        ...(data.sections ?? []).flatMap((s: any) => s.photos),
        ...(data.unsectioned ?? []),
      ].map((p: any) => ({ id: p.id, thumbnailUrl: p.thumbnailUrl ?? null, filename: p.filename }))
      setPhotos(all)
      setOpen(true)
    } finally {
      setLoading(false)
    }
  }

  const selected = photos.find((p) => p.id === coverPhotoId)

  return (
    <div>
      <div className="flex items-center gap-3">
        {/* Thumbnail preview of current cover */}
        {coverPhotoId && selected?.thumbnailUrl && (
          <div className="relative w-16 h-12 overflow-hidden bg-stone-100 shrink-0">
            <img src={selected.thumbnailUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        {coverPhotoId && !selected && (
          <div className="w-16 h-12 bg-stone-100 shrink-0" />
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={loadPhotos}
            disabled={loading}
            className="px-3 py-2 text-xs font-sans border border-stone-200 text-stone-700 hover:border-stone-400 transition-colors disabled:opacity-40"
          >
            {loading ? 'Loading…' : coverPhotoId ? 'Change' : 'Select cover photo'}
          </button>
          {coverPhotoId && (
            <button
              onClick={() => onChange(null)}
              className="text-stone-400 hover:text-stone-700 transition-colors"
              aria-label="Remove cover photo"
            >
              <X size={14} strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>

      {/* Photo grid picker */}
      {open && (
        <div className="mt-3 max-w-sm border border-stone-200 bg-white">
          <div className="flex items-center justify-between px-3 py-2 border-b border-stone-100">
            <span className="text-xs font-sans text-stone-500">Select a cover photo</span>
            <button onClick={() => setOpen(false)} className="text-stone-400 hover:text-stone-700 transition-colors">
              <X size={13} strokeWidth={1.5} />
            </button>
          </div>
          {photos.length === 0 ? (
            <p className="px-3 py-4 text-xs font-sans text-stone-400">No ready photos in this gallery yet.</p>
          ) : (
            <div className="grid grid-cols-4 gap-1 p-2 max-h-64 overflow-y-auto">
              {photos.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => { onChange(photo.id); setOpen(false) }}
                  className={`relative aspect-square overflow-hidden bg-stone-100 ${
                    coverPhotoId === photo.id ? 'ring-2 ring-stone-900' : 'hover:opacity-80'
                  }`}
                >
                  {photo.thumbnailUrl && (
                    <img src={photo.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  )}
                  {coverPhotoId === photo.id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Check size={14} strokeWidth={2.5} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
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
