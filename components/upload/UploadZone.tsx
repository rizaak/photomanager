'use client'

import { useState, useRef, useCallback } from 'react'
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react'
import type { UploadFile } from '@/lib/types'

interface UploadZoneProps {
  galleryId: string
  onComplete?: () => void
}

const statusIcon: Record<UploadFile['status'], React.ReactNode> = {
  ready:      <CheckCircle2 size={15} className="text-emerald-500" strokeWidth={1.5} />,
  processing: <Loader2 size={15} className="text-amber-500 animate-spin" strokeWidth={1.5} />,
  uploading:  <Loader2 size={15} className="text-stone-400 animate-spin" strokeWidth={1.5} />,
  error:      <AlertCircle size={15} className="text-red-500" strokeWidth={1.5} />,
}

const statusLabel: Record<UploadFile['status'], string> = {
  ready:      'Ready',
  processing: 'Queued',
  uploading:  'Uploading',
  error:      'Error',
}

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
        // Cap at 90% — the remaining 10% represents server-side DB + queue work
        onProgress(Math.min(Math.round((e.loaded / e.total) * 90), 90))
      }
    }

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText)
        if (xhr.status === 200) {
          resolve({ photoId: data.photoId })
        } else {
          resolve({ error: data.error ?? 'Upload failed' })
        }
      } catch {
        resolve({ error: 'Invalid server response' })
      }
    }

    xhr.onerror = () => resolve({ error: 'Network error' })
    xhr.ontimeout = () => resolve({ error: 'Request timed out' })
    xhr.timeout = 120_000 // 2 min — large files need time

    xhr.open('POST', '/api/photos/upload')
    xhr.send(formData)
  })
}

export function UploadZone({ galleryId, onComplete }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<UploadFile[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  function updateFile(id: string, patch: Partial<UploadFile>) {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)))
  }

  const startUpload = useCallback(
    async (selected: FileList | File[]) => {
      if (!galleryId || galleryId === 'new') {
        alert('Please select a gallery before uploading.')
        return
      }

      const incoming = Array.from(selected)
      if (incoming.length === 0) return

      // Add all files to the list immediately
      const entries: UploadFile[] = incoming.map((f) => ({
        id: crypto.randomUUID(),
        filename: f.name,
        sizeMB: parseFloat((f.size / 1024 / 1024).toFixed(1)),
        status: 'uploading',
        progress: 0,
      }))
      setFiles((prev) => [...prev, ...entries])

      // Upload in parallel
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
    [galleryId],
  )

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave() {
    setIsDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    startUpload(e.dataTransfer.files)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) startUpload(e.target.files)
    // Reset input so the same file can be re-selected if needed
    e.target.value = ''
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

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

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-6 space-y-2">
          <p className="text-xs font-sans text-stone-400 uppercase tracking-widest mb-3">
            {files.length} {files.length === 1 ? 'file' : 'files'}
          </p>
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-4 px-4 py-3 bg-white border border-stone-200"
            >
              {statusIcon[file.status]}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4 mb-1">
                  <span className="text-sm font-sans text-stone-700 truncate">{file.filename}</span>
                  <span className="text-xs font-sans text-stone-400 shrink-0">{file.sizeMB} MB</span>
                </div>

                {file.status === 'error' ? (
                  <p className="text-xs text-red-500 font-sans">{file.errorMessage}</p>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-0.5 bg-stone-100">
                      <div
                        className={`h-0.5 transition-all duration-500 ${
                          file.status === 'ready' ? 'bg-emerald-400' : 'bg-accent'
                        }`}
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-sans text-stone-400 shrink-0">
                      {statusLabel[file.status]}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() => removeFile(file.id)}
                className="text-stone-300 hover:text-stone-500 transition-colors shrink-0"
              >
                <X size={14} strokeWidth={1.5} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
