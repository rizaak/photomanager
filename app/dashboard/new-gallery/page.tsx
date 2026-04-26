'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function NewGalleryPage() {
  const router = useRouter()

  const [title,       setTitle]       = useState('')
  const [clientName,  setClientName]  = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [password,    setPassword]    = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !clientName.trim()) return
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/galleries', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          title:       title.trim(),
          clientName:  clientName.trim(),
          clientEmail: clientEmail.trim() || undefined,
          password:    password.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to create gallery')
        return
      }

      const { id } = await res.json()
      router.push(`/dashboard/gallery/${id}`)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="px-10 py-10 max-w-lg">

      {/* Back */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-stone-400 hover:text-stone-700 text-sm font-sans transition-colors mb-8"
      >
        <ArrowLeft size={14} strokeWidth={1.5} />
        Galleries
      </Link>

      <h1 className="font-serif text-3xl text-stone-900 mb-1">New Gallery</h1>
      <p className="text-sm text-stone-400 font-sans mb-10">
        Galleries are private by default — share the link when you&apos;re ready.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Title */}
        <div>
          <label className="block text-xs font-sans text-stone-500 uppercase tracking-widest mb-2">
            Gallery title <span className="text-stone-300">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Martinez Wedding"
            required
            className="w-full border border-stone-200 px-4 py-3 text-sm font-sans text-stone-900 placeholder-stone-300 focus:outline-none focus:border-stone-400 bg-white"
          />
        </div>

        {/* Client name */}
        <div>
          <label className="block text-xs font-sans text-stone-500 uppercase tracking-widest mb-2">
            Client name <span className="text-stone-300">*</span>
          </label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Elena & Marco Martinez"
            required
            className="w-full border border-stone-200 px-4 py-3 text-sm font-sans text-stone-900 placeholder-stone-300 focus:outline-none focus:border-stone-400 bg-white"
          />
        </div>

        {/* Client email — optional */}
        <div>
          <label className="block text-xs font-sans text-stone-500 uppercase tracking-widest mb-2">
            Client email <span className="text-stone-300 normal-case font-normal tracking-normal">optional</span>
          </label>
          <input
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            placeholder="elena@example.com"
            className="w-full border border-stone-200 px-4 py-3 text-sm font-sans text-stone-900 placeholder-stone-300 focus:outline-none focus:border-stone-400 bg-white"
          />
        </div>

        {/* Password — optional */}
        <div>
          <label className="block text-xs font-sans text-stone-500 uppercase tracking-widest mb-2">
            Access code <span className="text-stone-300 normal-case font-normal tracking-normal">optional</span>
          </label>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Leave blank for no password"
            className="w-full border border-stone-200 px-4 py-3 text-sm font-sans text-stone-900 placeholder-stone-300 focus:outline-none focus:border-stone-400 bg-white"
          />
          <p className="mt-1.5 text-xs text-stone-400 font-sans">
            Clients will be asked for this code before viewing the gallery.
          </p>
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-500 font-sans">{error}</p>
        )}

        {/* Submit */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={submitting || !title.trim() || !clientName.trim()}
          >
            {submitting ? 'Creating…' : 'Create gallery'}
          </Button>
          <Link href="/dashboard">
            <Button type="button" variant="ghost" size="md">Cancel</Button>
          </Link>
        </div>

      </form>
    </div>
  )
}
