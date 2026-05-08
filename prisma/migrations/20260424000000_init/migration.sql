-- CreateEnum
CREATE TYPE "PlanName" AS ENUM ('FREE', 'STARTER', 'PRO');

-- CreateEnum
CREATE TYPE "GalleryStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ClientActivity" AS ENUM ('NOT_OPENED', 'SELECTING', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "PhotoStatus" AS ENUM ('UPLOADING', 'PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "PhotoSource" AS ENUM ('DASHBOARD', 'LIGHTROOM');

-- CreateEnum
CREATE TYPE "DownloadStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "SelectionWorkflow" AS ENUM ('IN_PROGRESS', 'COMPLETED_BY_CLIENT', 'IN_REVIEW', 'EDITING', 'DELIVERED');

-- CreateEnum
CREATE TYPE "EditStatus" AS ENUM ('NONE', 'EDITING', 'FINAL_READY');

-- CreateEnum
CREATE TYPE "DownloadType" AS ENUM ('NONE', 'WATERMARKED', 'FINAL_EDITED', 'ORIGINALS', 'SELECTED_ONLY', 'FULL_GALLERY');

-- CreateEnum
CREATE TYPE "WatermarkPosition" AS ENUM ('CENTER', 'TOP_LEFT', 'TOP_RIGHT', 'BOTTOM_LEFT', 'BOTTOM_RIGHT');

-- CreateEnum
CREATE TYPE "GalleryEventType" AS ENUM ('GALLERY_OPENED', 'CLIENT_REGISTERED', 'PHOTO_SELECTED', 'PHOTO_DESELECTED', 'PHOTO_FAVORITED', 'PHOTO_UNFAVORITED', 'COMMENT_ADDED', 'SELECTION_SUBMITTED', 'FINAL_UPLOADED', 'FINALS_READY', 'DOWNLOAD_REQUESTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "auth0Sub" TEXT,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" "PlanName" NOT NULL,
    "storageLimitGB" INTEGER NOT NULL,
    "maxGalleries" INTEGER,
    "photoLimitPerGallery" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhotographerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "businessName" TEXT,
    "storageLimitGB" INTEGER NOT NULL DEFAULT 5,
    "storageUsedBytes" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhotographerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GalleryFolder" (
    "id" TEXT NOT NULL,
    "photographerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GalleryFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gallery" (
    "id" TEXT NOT NULL,
    "photographerId" TEXT NOT NULL,
    "folderId" TEXT,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT,
    "status" "GalleryStatus" NOT NULL DEFAULT 'DRAFT',
    "shareToken" TEXT NOT NULL,
    "password" TEXT,
    "expiresAt" TIMESTAMP(3),
    "allowSelection" BOOLEAN NOT NULL DEFAULT true,
    "allowFavorites" BOOLEAN NOT NULL DEFAULT false,
    "allowComments" BOOLEAN NOT NULL DEFAULT false,
    "requireClientInfo" BOOLEAN NOT NULL DEFAULT false,
    "downloadEnabled" BOOLEAN NOT NULL DEFAULT false,
    "downloadType" "DownloadType" NOT NULL DEFAULT 'NONE',
    "watermarkEnabled" BOOLEAN NOT NULL DEFAULT true,
    "watermarkPresetId" TEXT,
    "coverPhotoId" TEXT,
    "coverStyle" TEXT NOT NULL DEFAULT 'fullscreen',
    "galleryLayout" TEXT NOT NULL DEFAULT 'masonry',
    "typographyStyle" TEXT NOT NULL DEFAULT 'serif',
    "colorTheme" TEXT NOT NULL DEFAULT 'dark',
    "eventDate" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "clientActivity" "ClientActivity" NOT NULL DEFAULT 'NOT_OPENED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gallery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GallerySection" (
    "id" TEXT NOT NULL,
    "galleryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "visibleToClient" BOOLEAN NOT NULL DEFAULT true,
    "watermarkEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GallerySection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GalleryClient" (
    "id" TEXT NOT NULL,
    "galleryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "lastAccessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GalleryClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "galleryId" TEXT NOT NULL,
    "sectionId" TEXT,
    "filename" TEXT NOT NULL,
    "originalKey" TEXT NOT NULL,
    "previewKey" TEXT,
    "thumbnailKey" TEXT,
    "watermarkedKey" TEXT,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "status" "PhotoStatus" NOT NULL DEFAULT 'UPLOADING',
    "source" "PhotoSource" NOT NULL DEFAULT 'DASHBOARD',
    "originalFilename" TEXT,
    "editStatus" "EditStatus" NOT NULL DEFAULT 'NONE',
    "finalKey" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "labels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "appliedWatermarkPresetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Selection" (
    "id" TEXT NOT NULL,
    "galleryId" TEXT NOT NULL,
    "galleryClientId" TEXT,
    "clientEmail" TEXT,
    "clientName" TEXT,
    "submittedAt" TIMESTAMP(3),
    "workflowState" "SelectionWorkflow" NOT NULL DEFAULT 'IN_PROGRESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Selection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SelectionItem" (
    "id" TEXT NOT NULL,
    "selectionId" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SelectionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Download" (
    "id" TEXT NOT NULL,
    "galleryId" TEXT NOT NULL,
    "selectionId" TEXT,
    "status" "DownloadStatus" NOT NULL DEFAULT 'PENDING',
    "zipKey" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Download_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GalleryPreset" (
    "id" TEXT NOT NULL,
    "photographerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "allowSelection" BOOLEAN NOT NULL DEFAULT true,
    "allowFavorites" BOOLEAN NOT NULL DEFAULT false,
    "allowComments" BOOLEAN NOT NULL DEFAULT false,
    "requireClientInfo" BOOLEAN NOT NULL DEFAULT false,
    "downloadEnabled" BOOLEAN NOT NULL DEFAULT false,
    "downloadType" "DownloadType" NOT NULL DEFAULT 'NONE',
    "watermarkEnabled" BOOLEAN NOT NULL DEFAULT true,
    "expiresInDays" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GalleryPreset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GalleryActivityEvent" (
    "id" TEXT NOT NULL,
    "galleryId" TEXT NOT NULL,
    "eventType" "GalleryEventType" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GalleryActivityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "galleryId" TEXT NOT NULL,
    "galleryClientId" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "galleryId" TEXT NOT NULL,
    "galleryClientId" TEXT NOT NULL,
    "photoId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LightroomApiKey" (
    "id" TEXT NOT NULL,
    "label" TEXT,
    "keyHash" TEXT NOT NULL,
    "photographerId" TEXT NOT NULL,
    "defaultGalleryId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LightroomApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatermarkPreset" (
    "id" TEXT NOT NULL,
    "photographerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageKey" TEXT NOT NULL,
    "position" "WatermarkPosition" NOT NULL DEFAULT 'CENTER',
    "sizePct" INTEGER NOT NULL DEFAULT 20,
    "opacity" INTEGER NOT NULL DEFAULT 40,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WatermarkPreset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_auth0Sub_key" ON "User"("auth0Sub");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_name_key" ON "Plan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PhotographerProfile_userId_key" ON "PhotographerProfile"("userId");

-- CreateIndex
CREATE INDEX "GalleryFolder_photographerId_idx" ON "GalleryFolder"("photographerId");

-- CreateIndex
CREATE UNIQUE INDEX "Gallery_shareToken_key" ON "Gallery"("shareToken");

-- CreateIndex
CREATE INDEX "Gallery_photographerId_idx" ON "Gallery"("photographerId");

-- CreateIndex
CREATE INDEX "Gallery_photographerId_folderId_idx" ON "Gallery"("photographerId", "folderId");

-- CreateIndex
CREATE INDEX "Gallery_status_idx" ON "Gallery"("status");

-- CreateIndex
CREATE INDEX "GallerySection_galleryId_idx" ON "GallerySection"("galleryId");

-- CreateIndex
CREATE UNIQUE INDEX "GalleryClient_accessToken_key" ON "GalleryClient"("accessToken");

-- CreateIndex
CREATE INDEX "GalleryClient_galleryId_idx" ON "GalleryClient"("galleryId");

-- CreateIndex
CREATE UNIQUE INDEX "GalleryClient_galleryId_email_key" ON "GalleryClient"("galleryId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Photo_originalKey_key" ON "Photo"("originalKey");

-- CreateIndex
CREATE INDEX "Photo_galleryId_idx" ON "Photo"("galleryId");

-- CreateIndex
CREATE INDEX "Photo_galleryId_status_idx" ON "Photo"("galleryId", "status");

-- CreateIndex
CREATE INDEX "Photo_sectionId_idx" ON "Photo"("sectionId");

-- CreateIndex
CREATE INDEX "Selection_galleryId_idx" ON "Selection"("galleryId");

-- CreateIndex
CREATE INDEX "Selection_galleryClientId_idx" ON "Selection"("galleryClientId");

-- CreateIndex
CREATE INDEX "SelectionItem_photoId_idx" ON "SelectionItem"("photoId");

-- CreateIndex
CREATE UNIQUE INDEX "SelectionItem_selectionId_photoId_key" ON "SelectionItem"("selectionId", "photoId");

-- CreateIndex
CREATE INDEX "Download_galleryId_idx" ON "Download"("galleryId");

-- CreateIndex
CREATE INDEX "Download_selectionId_idx" ON "Download"("selectionId");

-- CreateIndex
CREATE INDEX "GalleryPreset_photographerId_idx" ON "GalleryPreset"("photographerId");

-- CreateIndex
CREATE INDEX "GalleryActivityEvent_galleryId_idx" ON "GalleryActivityEvent"("galleryId");

-- CreateIndex
CREATE INDEX "GalleryActivityEvent_galleryId_eventType_idx" ON "GalleryActivityEvent"("galleryId", "eventType");

-- CreateIndex
CREATE INDEX "Favorite_galleryId_idx" ON "Favorite"("galleryId");

-- CreateIndex
CREATE INDEX "Favorite_galleryClientId_idx" ON "Favorite"("galleryClientId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_galleryClientId_photoId_key" ON "Favorite"("galleryClientId", "photoId");

-- CreateIndex
CREATE INDEX "Comment_galleryId_idx" ON "Comment"("galleryId");

-- CreateIndex
CREATE INDEX "Comment_galleryClientId_idx" ON "Comment"("galleryClientId");

-- CreateIndex
CREATE INDEX "Comment_galleryClientId_photoId_idx" ON "Comment"("galleryClientId", "photoId");

-- CreateIndex
CREATE UNIQUE INDEX "LightroomApiKey_keyHash_key" ON "LightroomApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "LightroomApiKey_photographerId_idx" ON "LightroomApiKey"("photographerId");

-- CreateIndex
CREATE INDEX "LightroomApiKey_defaultGalleryId_idx" ON "LightroomApiKey"("defaultGalleryId");

-- CreateIndex
CREATE INDEX "WatermarkPreset_photographerId_idx" ON "WatermarkPreset"("photographerId");

-- AddForeignKey
ALTER TABLE "PhotographerProfile" ADD CONSTRAINT "PhotographerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotographerProfile" ADD CONSTRAINT "PhotographerProfile_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryFolder" ADD CONSTRAINT "GalleryFolder_photographerId_fkey" FOREIGN KEY ("photographerId") REFERENCES "PhotographerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gallery" ADD CONSTRAINT "Gallery_photographerId_fkey" FOREIGN KEY ("photographerId") REFERENCES "PhotographerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gallery" ADD CONSTRAINT "Gallery_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "GalleryFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gallery" ADD CONSTRAINT "Gallery_watermarkPresetId_fkey" FOREIGN KEY ("watermarkPresetId") REFERENCES "WatermarkPreset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GallerySection" ADD CONSTRAINT "GallerySection_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "Gallery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryClient" ADD CONSTRAINT "GalleryClient_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "Gallery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "Gallery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "GallerySection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Selection" ADD CONSTRAINT "Selection_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "Gallery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Selection" ADD CONSTRAINT "Selection_galleryClientId_fkey" FOREIGN KEY ("galleryClientId") REFERENCES "GalleryClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SelectionItem" ADD CONSTRAINT "SelectionItem_selectionId_fkey" FOREIGN KEY ("selectionId") REFERENCES "Selection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SelectionItem" ADD CONSTRAINT "SelectionItem_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Photo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Download" ADD CONSTRAINT "Download_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "Gallery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Download" ADD CONSTRAINT "Download_selectionId_fkey" FOREIGN KEY ("selectionId") REFERENCES "Selection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryPreset" ADD CONSTRAINT "GalleryPreset_photographerId_fkey" FOREIGN KEY ("photographerId") REFERENCES "PhotographerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryActivityEvent" ADD CONSTRAINT "GalleryActivityEvent_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "Gallery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "Gallery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_galleryClientId_fkey" FOREIGN KEY ("galleryClientId") REFERENCES "GalleryClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Photo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "Gallery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_galleryClientId_fkey" FOREIGN KEY ("galleryClientId") REFERENCES "GalleryClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Photo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LightroomApiKey" ADD CONSTRAINT "LightroomApiKey_photographerId_fkey" FOREIGN KEY ("photographerId") REFERENCES "PhotographerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LightroomApiKey" ADD CONSTRAINT "LightroomApiKey_defaultGalleryId_fkey" FOREIGN KEY ("defaultGalleryId") REFERENCES "Gallery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatermarkPreset" ADD CONSTRAINT "WatermarkPreset_photographerId_fkey" FOREIGN KEY ("photographerId") REFERENCES "PhotographerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

