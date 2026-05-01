import { Resend } from 'resend'

export interface EmailMessage {
  to:      string
  subject: string
  html:    string
  text:    string   // plain-text fallback
}

// ── Resend client (lazy — only instantiated when a key is present) ─────────────

let _resend: Resend | null = null

function getResend(): Resend | null {
  if (_resend) return _resend
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.warn('[EmailProvider] RESEND_API_KEY is not set — emails will be skipped')
    return null
  }
  _resend = new Resend(key)
  return _resend
}

// ── Send ───────────────────────────────────────────────────────────────────────

async function sendEmail(msg: EmailMessage): Promise<void> {
  const resend = getResend()

  if (!resend) {
    // Dev fallback: log the email so it's visible without a key
    console.log(
      `[email] ─────────────────────────────────────\n` +
      `  To:      ${msg.to}\n` +
      `  Subject: ${msg.subject}\n` +
      `  Body:    ${msg.text}\n` +
      `─────────────────────────────────────────────`,
    )
    return
  }

  const from = process.env.EMAIL_FROM ?? 'Frame <notifications@resend.dev>'

  const { error } = await resend.emails.send({
    from,
    to:      msg.to,
    subject: msg.subject,
    html:    msg.html,
    text:    msg.text,
  })

  if (error) {
    // Throw so BullMQ can retry the job
    throw new Error(`[EmailProvider] Resend error: ${error.message}`)
  }

  console.log(`[EmailProvider] sent "${msg.subject}" → ${msg.to}`)
}

export const emailProvider = { sendEmail }
