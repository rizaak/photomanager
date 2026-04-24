# Queue

## Tool

Use BullMQ with Redis.

---

## Purpose

Queue is used for background jobs:

- image processing
- watermark generation
- format conversion
- ZIP generation
- email notifications

---

## Flow

1. API receives request
2. Job is created and added to queue
3. Worker processes job
4. Result is stored (R2 or DB)

---

## Rules

- do not run heavy tasks in controllers
- all image processing must go through queue
- handle retries for failed jobs
- log errors for debugging

---

## Example Jobs

- process-image
- generate-thumbnail
- apply-watermark
- generate-zip