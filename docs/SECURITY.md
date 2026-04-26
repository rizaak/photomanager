# Security

## Access Control

- Photographer dashboard requires authentication (Auth0)
- Public gallery routes must be accessible without login
- Photographers can only access their own galleries and photos
- Do not expose internal database IDs in public URLs

---

## Authentication

- Use Auth0 as the only authentication provider
- Do not implement custom auth
- Do not store passwords
- Use Auth0 user id as external identifier

---

## Authorization

- Validate ownership on every protected resource
- A photographer can only:
  - read their galleries
  - modify their galleries
  - manage their photos

---

## File Access

- Originals must always be private
- Never expose raw R2 URLs
- Use signed URLs for downloads
- Signed URLs must expire

---

## Upload Validation

- Validate file type (images only)
- Validate file size
- Reject unsupported formats
- Limit upload size

---

## API Security

- Validate all input
- Use proper HTTP status codes
- Do not trust client input
- Prevent over-fetching sensitive data

---

## Sensitive Data

- Do not expose:
  - storage keys
  - database internals
  - private URLs

- Use environment variables for secrets

---

## Queue & Jobs

- Validate job payloads
- Do not trust job input blindly
- Handle failures safely
- Log errors

---

## General Rules

- Fail safely
- Keep everything private by default
- Only expose what is necessary