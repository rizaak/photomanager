# Storage

## Provider

All storage must go through StorageProvider.

Do not call R2 directly from services or controllers.

---

## Structure

photos/
  originals/
  previews/
  thumbnails/
  watermarked/

---

## File Naming

- use UUIDs
- do not use original filenames
- keep consistent structure

Example:

photos/originals/{photoId}.jpg
photos/previews/{photoId}.webp

---

## Rules

- originals are private
- previews are optimized for fast loading
- thumbnails are small and cached
- never expose raw storage paths

---

## Access

- use signed URLs for downloads
- define expiration time