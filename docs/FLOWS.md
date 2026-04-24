# Flows

## Upload Flow

1. Photographer uploads images
2. API validates file (type, size)
3. Original file stored in R2
4. Photo record created in database
5. Job added to queue (BullMQ)

---

## Processing Flow

Worker processes image:

- generate thumbnail (small)
- generate preview (compressed)
- apply watermark
- optional format conversion (webp, jpg)

Processed files stored in R2

---

## Gallery View Flow

Client opens gallery:

- loads thumbnails or previews
- never loads original images
- pagination is required for large galleries

---

## Selection Flow

Client:

- selects favorite photos

System:

- stores selections in database
- associates selection with gallery and user

---

## Download Flow

1. Photographer enables downloads
2. Client requests download
3. API validates permissions
4. API generates signed URL
5. Client downloads file

Optional:

- generate ZIP for multiple files