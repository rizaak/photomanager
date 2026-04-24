# Modules

This project is organized using domain-based modules.

Each module represents a core business domain.

---

## auth

Handles:
- authentication
- sessions
- user identity
- permissions

---

## users

Handles:
- user profile
- account data
- user settings

---

## photographers

Handles:
- photographer profile
- business information
- branding settings
- storage limits

---

## galleries

Handles:
- gallery creation
- gallery settings
- privacy controls
- share links
- password protection

---

## photos

Handles:
- photo upload
- photo metadata
- processing status
- thumbnails
- previews
- watermarked versions

---

## selections

Handles:
- client photo selections
- favorites
- approved photos
- selection tracking

---

## downloads

Handles:
- signed URLs
- download permissions
- final file access
- ZIP generation

---

## billing

Handles:
- subscription plans
- storage limits
- usage tracking
- Stripe integration

---

## notifications

Handles:
- email notifications
- gallery shared emails
- selection completed emails

---

## Infrastructure (shared)

These are shared services used across modules:

- storage (Cloudflare R2)
- queue (BullMQ)
- email
- payments
- database

Located in:

src/infrastructure/

---

## Folder Structure

Each module should follow this structure:

module-name/
  controllers/
  services/
  repositories/
  dto/
  entities/
  types/
  module.ts

---

## Rules

- One module = one domain
- Do not mix responsibilities between modules
- Controllers must be thin
- Business logic belongs in services
- Shared logic goes in infrastructure or shared layer