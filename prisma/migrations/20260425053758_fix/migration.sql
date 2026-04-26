/*
  Warnings:

  - A unique constraint covering the columns `[originalKey]` on the table `Photo` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "Download_galleryId_idx" ON "Download"("galleryId");

-- CreateIndex
CREATE INDEX "Download_selectionId_idx" ON "Download"("selectionId");

-- CreateIndex
CREATE INDEX "Gallery_photographerId_idx" ON "Gallery"("photographerId");

-- CreateIndex
CREATE INDEX "Gallery_status_idx" ON "Gallery"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Photo_originalKey_key" ON "Photo"("originalKey");

-- CreateIndex
CREATE INDEX "Photo_galleryId_idx" ON "Photo"("galleryId");

-- CreateIndex
CREATE INDEX "Photo_galleryId_status_idx" ON "Photo"("galleryId", "status");

-- CreateIndex
CREATE INDEX "Selection_galleryId_idx" ON "Selection"("galleryId");

-- CreateIndex
CREATE INDEX "SelectionItem_photoId_idx" ON "SelectionItem"("photoId");
