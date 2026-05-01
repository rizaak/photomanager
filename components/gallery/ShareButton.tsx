'use client'

import { useState } from 'react'
import { Share2, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function ShareButton({ shareToken }: { shareToken: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    const url = `${window.location.origin}/gallery/${shareToken}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    })
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleCopy}>
      {copied
        ? <Check size={13} strokeWidth={2} />
        : <Share2 size={13} strokeWidth={1.5} />
      }
      {copied ? 'Link copied' : 'Share'}
    </Button>
  )
}
