 ## Watermark Protection

- Watermarks must be baked into preview images during processing.
- Do not rely on frontend-only watermark overlays.
- Originals must remain private and unmodified.
- If a gallery enables watermarking, public gallery previews should use watermarked files.

## Manual Watermark Safety

- Applying or removing watermark affects preview assets only.
- Original files must never be modified.
- Public galleries should use the correct preview based on gallery/photo watermark settings.
- If watermark regeneration fails, do not expose the original as fallback.