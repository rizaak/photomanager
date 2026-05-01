'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { UploadCloud, AlertCircle, Loader2, X, CheckCircle2 } from 'lucide-react'
import type { UploadFile } from '@/lib/types'

interface UploadZoneProps {
  galleryId: string
  onComplete?: () => void
}

// How long a completed file stays visible before disappearing
const COMPLETED_LINGER_MS = 3000

function uploadFileXHR(
  file: File,
  galleryId: string,
  onProgress: (pct: number) => void,
): Promise<{ photoId: string } | { error: string }> {
  return new Promise((resolve) => {
    const formData = new FormData()
    formData.append('galleryId', galleryId)
    formData.append('file', file)

    const xhr = new XMLHttpRequest()

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.min(Math.round((e.loaded / e.total) * 90), 90))
      }
    }

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText)
        if (xhr.status === 200) resolve({ photoId: data.photoId })
        else resolve({ error: data.error ?? 'Upload failed' })
      } catch {
        resolve({ error: 'Invalid server response' })
      }
    }

    xhr.onerror   = () => resolve({ error: 'Network error' })
    xhr.ontimeout = () => resolve({ error: 'Request timed out' })
    xhr.timeout   = 120_000

    xhr.open('POST', '/api/photos/upload')
    xhr.send(formData)
  })
}

// Extended internal type with optional doneAt timestamp for auto-collapse
type UploadEntry = UploadFile & { doneAt?: number }

export function UploadZone({ galleryId, onComplete }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles]           = useState<UploadEntry[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const timers   = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // Schedule auto-removal of a completed file
  function scheduleRemoval(id: string) {
    const t = setTimeout(() => {
      setFiles((prev) => prev.filter((f) => f.id !== id))
      timers.current.delete(id)
    }, COMPLETED_LINGER_MS)
    timers.current.set(id, t)
  }

  // Clear all timers on unmount
  useEffect(() => {
    return () => { timers.current.forEach(clearTimeout) }
  }, [])

  function updateFile(id: string, patch: Partial<UploadEntry>) {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f
        const next = { ...f, ...patch }
        // When a file completes successfully, record the time and schedule removal
        if (patch.status === 'ready' && f.status !== 'ready') {
          next.doneAt = Date.now()
          scheduleRemoval(id)
        }
        return next
      }),
    )
  }

  function removeFile(id: string) {
    const t = timers.current.get(id)
    if (t) { clearTimeout(t); timers.current.delete(id) }
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const startUpload = useCallback(
    async (selected: FileList | File[]) => {
      if (!galleryId || galleryId === 'new') {
        alert('Please select a gallery before uploading.')
        return
      }

      const incoming = Array.from(selected)
      if (incoming.length === 0) return

      const entries: UploadEntry[] = incoming.map((f) => ({
        id:       crypto.randomUUID(),
        filename: f.name,
        sizeMB:   parseFloat((f.size / 1024 / 1024).toFixed(1)),
        status:   'uploading',
        progress: 0,
      }))
      setFiles((prev) => [...prev, ...entries])

      await Promise.all(
        incoming.map(async (file, i) => {
          const entry = entries[i]
          const result = await uploadFileXHR(file, galleryId, (pct) => {
            updateFile(entry.id, { progress: pct })
          })

          if ('error' in result) {
            updateFile(entry.id, { status: 'error', progress: 0, errorMessage: result.error })
          } else {
            updateFile(entry.id, { status: 'ready', progress: 100 })
            onComplete?.()
          }
        }),
      )
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [galleryId],
  )

  function handleDragOver(e: React.DragEvent) { e.preventDefault(); setIsDragging(true) }
  function handleDragLeave() { setIsDragging(false) }
  function handleDrop(e: React.DragEvent) { e.preventDefault(); setIsDragging(false); startUpload(e.dataTransfer.files) }
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) startUpload(e.target.files)
    e.target.value = ''
  }

  // Counts
  const totalEver    = files.length
  const uploading    = files.filter((f) => f.status === 'uploading').length
  const done         = files.filter((f) => f.status === 'ready').length
  const failed       = files.filter((f) => f.status === 'error').length
  const hasActivity  = totalEver > 0
  // Files to show in the list: in-progress + failed (completed auto-disappear via timer)
  const visibleFiles = files.filter((f) => f.status !== 'ready')

  return (
    <div>
      {/* Drop zone */}
      <div
        className={`relative border-2 border-dashed transition-colors cursor-pointer ${
          isDragging
            ? 'border-accent bg-accent-light'
            : 'border-stone-300 bg-white hover:border-stone-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/heic,image/webp"
          className="sr-only"
          onChange={handleInputChange}
        />

        <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
          <UploadCloud
            size={40}
            strokeWidth={1}
            className={`mb-5 transition-colors ${isDragging ? 'text-accent' : 'text-stone-300'}`}
          />
          <p className="font-serif text-xl text-stone-700 mb-2">Drop photos here</p>
          <p className="text-sm text-stone-400 font-sans">or click to browse your files</p>
          <p className="text-xs text-stone-300 font-sans mt-4">
            JPG, PNG, HEIC, WEBP &nbsp;·&nbsp; Max 50 MB per file
          </p>
        </div>
      </div>

      {/* Status summary */}
      {hasActivity && (
        <div className="mt-5">
          {/* Summary line */}
          <div className="flex items-center gap-3 px-1 mb-3">
            {uploading > 0 ? (
              <Loader2 size={13} strokeWidth={1.5} className="text-stone-400 animate-spin shrink-0" />
            ) : failed > 0 ? (
              <AlertCircle size={13} strokeWidth={1.5} className="text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 size={13} strokeWidth={1.5} className="text-emerald-500 shrink-0" />
            )}
            <p className="text-xs font-sans text-stone-500">
              {totalEver} {totalEver === 1 ? 'file' : 'files'}
              {done > 0    && <span className="text-emerald-500"> · {done} done</span>}
              {uploading > 0 && <span className="text-stone-400"> · {uploading} uploading</span>}
              {failed > 0  && <span className="text-red-400"> · {failed} failed</span>}
            </p>
          </div>

          {/* In-progress + failed rows */}
          {visibleFiles.length > 0 && (
            <div className="space-y-px">
              {visibleFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 px-4 py-2.5 bg-stone-50 border border-stone-100"
                >
                  {file.status === 'error' ? (
                    <AlertCircle size={13} strokeWidth={1.5} className="text-red-400 shrink-0" />
                  ) : (
                    <Loader2 size={13} strokeWidth={1.5} className="text-stone-400 animate-spin shrink-0" />
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-sans text-stone-600 truncate">{file.filename}</p>
                    {file.status === 'error' ? (
                      <p className="text-[11px] font-sans text-red-400 mt-0.5">{file.errorMessage}</p>
                    ) : (
                      <div className="mt-1.5 h-px bg-stone-200">
                        <div
                          className="h-px bg-stone-400 transition-all duration-500"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => removeFile(file.id)}
                    className="text-stone-300 hover:text-stone-500 transition-colors shrink-0"
                    aria-label="Dismiss"
                  >
                    <X size={12} strokeWidth={1.5} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
