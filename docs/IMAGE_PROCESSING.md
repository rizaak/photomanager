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

## Watermark

- semi-transparent
- consistent position (center or corner)
- same style across all images