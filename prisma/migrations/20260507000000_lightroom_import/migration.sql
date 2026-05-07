-- CreateEnum
CREATE TYPE "PhotoSource" AS ENUM ('DASHBOARD', 'LIGHTROOM');

-- AlterTable Photo
ALTER TABLE "Photo"
  ADD COLUMN "source" "PhotoSource" NOT NULL DEFAULT 'DASHBOARD',
  ADD COLUMN "originalFilename" TEXT;

-- CreateTable
CREATE TABLE "LightroomApiKey" (
  "id"             TEXT NOT NULL,
  "label"          TEXT,
  "keyHash"        TEXT NOT NULL,
  "photographerId" TEXT NOT NULL,
  "galleryId"      TEXT NOT NULL,
  "active"         BOOLEAN NOT NULL DEFAULT true,
  "lastUsedAt"     TIMESTAMP(3),
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LightroomApiKey_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LightroomApiKey_keyHash_key" UNIQUE ("keyHash"),
  CONSTRAINT "LightroomApiKey_photographerId_fkey" FOREIGN KEY ("photographerId") REFERENCES "PhotographerProfile"("id") ON DELETE CASCADE,
  CONSTRAINT "LightroomApiKey_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "Gallery"("id") ON DELETE CASCADE
);

CREATE INDEX "LightroomApiKey_photographerId_idx" ON "LightroomApiKey"("photographerId");
