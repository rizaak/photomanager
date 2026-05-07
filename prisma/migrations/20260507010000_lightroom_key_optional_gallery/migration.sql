-- Rename galleryId -> defaultGalleryId and make it optional
ALTER TABLE "LightroomApiKey" RENAME COLUMN "galleryId" TO "defaultGalleryId";
ALTER TABLE "LightroomApiKey" ALTER COLUMN "defaultGalleryId" DROP NOT NULL;

-- Replace FK constraint (Cascade -> SetNull for optional relation)
ALTER TABLE "LightroomApiKey" DROP CONSTRAINT IF EXISTS "LightroomApiKey_galleryId_fkey";
ALTER TABLE "LightroomApiKey" ADD CONSTRAINT "LightroomApiKey_defaultGalleryId_fkey"
  FOREIGN KEY ("defaultGalleryId") REFERENCES "Gallery"(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Add index for the default gallery FK (photographerId index already exists)
CREATE INDEX IF NOT EXISTS "LightroomApiKey_defaultGalleryId_idx" ON "LightroomApiKey"("defaultGalleryId");
