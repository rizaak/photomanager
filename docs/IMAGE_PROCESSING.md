# Image Processing

## Tool

Use sharp for all image processing.

---

## Outputs per image

Each uploaded image must generate:

1. Thumbnail
   - small size
   - fast load

2. Preview
   - compressed
   - lower resolution

3. Watermarked Preview
   - overlay watermark
   - used in gallery view

4. Optional formats
   - webp
   - jpg

---

## Rules

- processing must be async
- do not process inside controllers
- use queue workers (BullMQ)

---

## Watermark Presets

- Watermarks are configured per photographer.
- A photographer can have multiple watermark presets.
- One watermark preset can be marked as default.
- A gallery can override the photographer default watermark.
- Watermarks are applied during image processing using sharp.
- Originals are never watermarked.
- Public previews should use watermarked versions when enabled.

Supported settings:
- image
- size
- position
- opacity
- default flag

## Manual Watermark Actions

- Photographer can manually apply a watermark preset to one or multiple photos.
- Manual watermarking regenerates only the watermarked preview.
- Originals are never modified.
- Watermark regeneration must run through BullMQ.
- Photo should show processing state while watermark preview is regenerating.