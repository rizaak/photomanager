/**
 * Email templates — minimal, premium HTML.
 * All templates return { html, text } pairs.
 */

// ── Base layout ────────────────────────────────────────────────────────────────

function layout(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Frame</title>
</head>
<body style="margin:0;padding:0;background:#f9f7f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#292524;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f7f5;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e7e5e4;">

          <!-- wordmark -->
          <tr>
            <td style="padding:32px 40px 0 40px;border-bottom:1px solid #f5f5f4;">
              <p style="margin:0 0 20px 0;font-size:13px;letter-spacing:0.18em;text-transform:uppercase;color:#a8a29e;font-family:Georgia,serif;">
                Frame
              </p>
            </td>
          </tr>

          <!-- body -->
          <tr>
            <td style="padding:36px 40px 40px 40px;">
              ${body}
            </td>
          </tr>

          <!-- footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #f5f5f4;">
              <p style="margin:0;font-size:11px;color:#d6d3d1;line-height:1.6;">
                You're receiving this because you use Frame to manage your photography galleries.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 16px 0;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:normal;color:#1c1917;line-height:1.3;">${text}</h1>`
}

function para(text: string): string {
  return `<p style="margin:0 0 14px 0;font-size:14px;line-height:1.7;color:#57534e;">${text}</p>`
}

function subtle(text: string): string {
  return `<p style="margin:16px 0 0 0;font-size:12px;color:#a8a29e;line-height:1.6;">${text}</p>`
}

function pill(label: string): string {
  return `<span style="display:inline-block;background:#f5f5f4;border:1px solid #e7e5e4;padding:2px 10px;font-size:12px;color:#78716c;">${label}</span>`
}

function cta(href: string, label: string): string {
  return `
    <table cellpadding="0" cellspacing="0" style="margin:24px 0 0 0;">
      <tr>
        <td style="background:#1c1917;">
          <a href="${href}" style="display:inline-block;padding:11px 24px;font-size:13px;color:#ffffff;text-decoration:none;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;letter-spacing:0.02em;">
            ${label}
          </a>
        </td>
      </tr>
    </table>`
}

// ── Templates ──────────────────────────────────────────────────────────────────

export const templates = {

  clientRegistered(opts: {
    clientName:   string
    clientEmail:  string
    galleryTitle: string
    dashboardUrl: string
  }) {
    const html = layout(
      heading(`New client — ${opts.galleryTitle}`) +
      para(`<strong style="color:#1c1917;">${opts.clientName}</strong> (${opts.clientEmail}) just registered to view your gallery.`) +
      para(`They now have access and can start browsing and selecting photos.`) +
      cta(opts.dashboardUrl, 'View gallery →') +
      subtle(`Gallery: ${opts.galleryTitle}`),
    )
    const text =
      `New client registered — ${opts.galleryTitle}\n\n` +
      `${opts.clientName} (${opts.clientEmail}) just registered to view your gallery "${opts.galleryTitle}".\n\n` +
      `Open your dashboard: ${opts.dashboardUrl}`

    return { html, text }
  },

  selectionSubmitted(opts: {
    clientName:   string
    photoCount:   number
    galleryTitle: string
    dashboardUrl: string
  }) {
    const n = opts.photoCount
    const html = layout(
      heading(`Selection submitted — ${opts.galleryTitle}`) +
      para(`${opts.clientName || 'Your client'} has submitted a selection of ${pill(`${n} photo${n !== 1 ? 's' : ''}`)} from your gallery.`) +
      para(`Review their selection and move the workflow to editing when ready.`) +
      cta(opts.dashboardUrl, 'Review selection →') +
      subtle(`Gallery: ${opts.galleryTitle}`),
    )
    const text =
      `Selection submitted — ${opts.galleryTitle}\n\n` +
      `${opts.clientName || 'Your client'} submitted a selection of ${n} photo${n !== 1 ? 's' : ''} from "${opts.galleryTitle}".\n\n` +
      `Review it here: ${opts.dashboardUrl}`

    return { html, text }
  },

  commentAdded(opts: {
    clientName:   string
    galleryTitle: string
    comment:      string
    dashboardUrl: string
  }) {
    const html = layout(
      heading(`New comment — ${opts.galleryTitle}`) +
      para(`<strong style="color:#1c1917;">${opts.clientName || 'Your client'}</strong> left a comment on your gallery:`) +
      `<blockquote style="margin:16px 0;padding:12px 16px;border-left:2px solid #e7e5e4;font-size:14px;color:#78716c;font-style:italic;">${opts.comment}</blockquote>` +
      cta(opts.dashboardUrl, 'View gallery →') +
      subtle(`Gallery: ${opts.galleryTitle}`),
    )
    const text =
      `New comment — ${opts.galleryTitle}\n\n` +
      `${opts.clientName || 'Your client'} commented:\n"${opts.comment}"\n\n` +
      `View it here: ${opts.dashboardUrl}`

    return { html, text }
  },

  downloadRequested(opts: {
    galleryTitle: string
    count:        number
    type:         string
    dashboardUrl: string
  }) {
    const html = layout(
      heading(`Download requested — ${opts.galleryTitle}`) +
      para(`Your client requested a download of ${pill(`${opts.count} ${opts.type}`)} from your gallery.`) +
      cta(opts.dashboardUrl, 'View gallery →') +
      subtle(`Gallery: ${opts.galleryTitle}`),
    )
    const text =
      `Download requested — ${opts.galleryTitle}\n\n` +
      `Your client requested a download of ${opts.count} ${opts.type} from "${opts.galleryTitle}".\n\n` +
      `Dashboard: ${opts.dashboardUrl}`

    return { html, text }
  },

  finalsReady(opts: {
    galleryTitle: string
    finalCount:   number
    galleryUrl:   string
  }) {
    const n = opts.finalCount
    const html = layout(
      heading(`Your photos are ready`) +
      para(`Your edited photos from <strong style="color:#1c1917;">${opts.galleryTitle}</strong> are ready for download.`) +
      para(`${pill(`${n} photo${n !== 1 ? 's' : ''}`)} have been finalised and are now available.`) +
      cta(opts.galleryUrl, 'Download your photos →') +
      subtle(`This link opens the gallery. Download links expire after 15 minutes for security.`),
    )
    const text =
      `Your edited photos are ready — ${opts.galleryTitle}\n\n` +
      `${n} final edited photo${n !== 1 ? 's' : ''} from "${opts.galleryTitle}" are now ready for download.\n\n` +
      `Open your gallery: ${opts.galleryUrl}`

    return { html, text }
  },
}
