# Architecture

## Style

This project uses:

- Modular Monolith
- Domain-based modules
- SOLID principles
- Light Clean Architecture
- Background job processing

We are NOT using microservices for the MVP.

---

## Main Flow

Photographer uploads images:

1. API receives upload request
2. Original file is stored in Cloudflare R2
3. Photo metadata is saved in PostgreSQL
4. A BullMQ job is created
5. Worker processes the image using sharp
6. System generates:
   - thumbnail
   - compressed preview
   - watermarked preview
   - optional converted formats
7. Processed files are stored in R2
8. Client views watermarked gallery
9. Client selects photos
10. Photographer enables downloads
11. Client downloads via signed URLs

---

## Layers

### Controller

Responsible for:
- receiving HTTP requests
- validating input
- calling services
- returning responses

Controllers MUST NOT contain business logic.

---

### Service

Responsible for:
- business rules
- authorization checks
- orchestration
- calling repositories and providers

---

### Repository

Responsible for:
- database reads
- database writes
- query logic

---

### Provider

Responsible for:
- external services
- Cloudflare R2
- email
- payments
- queues

---

## Dependency Rule

Business logic MUST NOT depend directly on infrastructure.

Correct approach:

Use an abstraction like:

StorageProvider.upload(file)

Incorrect approach:

Direct calls to R2 SDK or external clients inside services or controllers.

---

## Background Processing

- All heavy operations must be async
- Use BullMQ for:
  - image processing
  - format conversion
  - watermark generation
  - ZIP generation

---

## Performance Rules

- Never load full-resolution images in galleries
- Always use compressed previews
- Use thumbnails for fast lists
- Use pagination for large galleries

---

## Key Principle

Keep the system simple, modular, and scalable.

Avoid premature abstraction or over-engineering.