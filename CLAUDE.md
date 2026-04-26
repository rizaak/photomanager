# Claude Project Rules

## Behavior
- Read existing files before writing.
- Do not guess project structure.
- Be concise in output.
- Prefer code over long explanations.
- Only modify files related to the task.
- Do not refactor unrelated code.

## Architecture
- Use Modular Monolith.
- Organize code by domain inside src/modules/.
- Follow controller -> service -> repository.
- Controllers only handle HTTP requests.
- Services contain business logic.
- Repositories handle database access.
- Providers handle external services.

## Tech Rules
- Use TypeScript.
- Use PostgreSQL as main database.
- Use Cloudflare R2 for file storage.
- Access R2 only through StorageProvider.
- Use BullMQ for background jobs.
- Use sharp for image processing.
- Use signed URLs for private downloads.

## Product Rules
- The product is a photo gallery platform for photographers.
- Core flow: upload photos -> generate previews -> apply watermark -> client selects photos -> final download.
- Do not build CRM, website builder, or marketplace features unless requested.

## Security
- Never expose raw R2 paths.
- Use signed URLs for downloads.
- Validate file types and file sizes.
- Keep galleries private by default.
- Follow docs/PHOTO_PROTECTION.md when handling gallery images, downloads, previews, and storage URLs.

## Performance
- Do not process images inside controllers.
- Use background jobs for thumbnails, watermarks, previews, and format conversion.
- Avoid loading full-resolution images in gallery previews.