-- Idempotent baseline migration: safe to run on both empty and existing databases.
-- ENUMs use DO/EXCEPTION, tables use IF NOT EXISTS, indexes use IF NOT EXISTS,
-- foreign keys use DO/EXCEPTION.

-- Enums
DO $$ BEGIN CREATE TYPE "PlanName"          AS ENUM ('FREE', 'STARTER', 'PRO');                                                                                    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "GalleryStatus"     AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');                                                                               EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "ClientActivity"    AS ENUM ('NOT_OPENED', 'SELECTING', 'SUBMITTED');                                                                       EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "PhotoStatus"       AS ENUM ('UPLOADING', 'PROCESSING', 'READY', 'FAILED');                                                                 EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "PhotoSource"       AS ENUM ('DASHBOARD', 'LIGHTROOM');                                                                                     EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "DownloadStatus"    AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED');                                                                   EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "SelectionWorkflow" AS ENUM ('IN_PROGRESS', 'COMPLETED_BY_CLIENT', 'IN_REVIEW', 'EDITING', 'DELIVERED');                                    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "EditStatus"        AS ENUM ('NONE', 'EDITING', 'FINAL_READY');                                                                             EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "DownloadType"      AS ENUM ('NONE', 'WATERMARKED', 'FINAL_EDITED', 'ORIGINALS', 'SELECTED_ONLY', 'FULL_GALLERY');                          EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "WatermarkPosition" AS ENUM ('CENTER', 'TOP_LEFT', 'TOP_RIGHT', 'BOTTOM_LEFT', 'BOTTOM_RIGHT');                                             EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "GalleryEventType"  AS ENUM ('GALLERY_OPENED', 'CLIENT_REGISTERED', 'PHOTO_SELECTED', 'PHOTO_DESELECTED', 'PHOTO_FAVORITED', 'PHOTO_UNFAVORITED', 'COMMENT_ADDED', 'SELECTION_SUBMITTED', 'FINAL_UPLOADED', 'FINALS_READY', 'DOWNLOAD_REQUESTED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tables
CREATE TABLE IF NOT EXISTS "User" (
    "id"           TEXT        NOT NULL,
    "email"        TEXT        NOT NULL,
    "auth0Sub"     TEXT,
    "name"         TEXT        NOT NULL,
    "passwordHash" TEXT,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Plan" (
    "id"                   TEXT        NOT NULL,
    "name"                 "PlanName"  NOT NULL,
    "storageLimitGB"       INTEGER     NOT NULL,
    "maxGalleries"         INTEGER,
    "photoLimitPerGallery" INTEGER,
    "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PhotographerProfile" (
    "id"               TEXT    NOT NULL,
    "userId"           TEXT    NOT NULL,
    "planId"           TEXT    NOT NULL,
    "businessName"     TEXT,
    "storageLimitGB"   INTEGER NOT NULL DEFAULT 5,
    "storageUsedBytes" BIGINT  NOT NULL DEFAULT 0,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PhotographerProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "GalleryFolder" (
    "id"             TEXT    NOT NULL,
    "photographerId" TEXT    NOT NULL,
    "name"           TEXT    NOT NULL,
    "sortOrder"      INTEGER NOT NULL DEFAULT 0,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GalleryFolder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Gallery" (
    "id"               TEXT             NOT NULL,
    "photographerId"   TEXT             NOT NULL,
    "folderId"         TEXT,
    "title"            TEXT             NOT NULL,
    "subtitle"         TEXT,
    "clientName"       TEXT             NOT NULL,
    "clientEmail"      TEXT,
    "status"           "GalleryStatus"  NOT NULL DEFAULT 'DRAFT',
    "shareToken"       TEXT             NOT NULL,
    "password"         TEXT,
    "expiresAt"        TIMESTAMP(3),
    "allowSelection"   BOOLEAN          NOT NULL DEFAULT true,
    "allowFavorites"   BOOLEAN          NOT NULL DEFAULT false,
    "allowComments"    BOOLEAN          NOT NULL DEFAULT false,
    "requireClientInfo" BOOLEAN         NOT NULL DEFAULT false,
    "downloadEnabled"  BOOLEAN          NOT NULL DEFAULT false,
    "downloadType"     "DownloadType"   NOT NULL DEFAULT 'NONE',
    "watermarkEnabled" BOOLEAN          NOT NULL DEFAULT true,
    "watermarkPresetId" TEXT,
    "coverPhotoId"     TEXT,
    "coverStyle"       TEXT             NOT NULL DEFAULT 'fullscreen',
    "galleryLayout"    TEXT             NOT NULL DEFAULT 'masonry',
    "typographyStyle"  TEXT             NOT NULL DEFAULT 'serif',
    "colorTheme"       TEXT             NOT NULL DEFAULT 'dark',
    "eventDate"        TEXT,
    "tags"             TEXT[]           DEFAULT ARRAY[]::TEXT[],
    "clientActivity"   "ClientActivity" NOT NULL DEFAULT 'NOT_OPENED',
    "createdAt"        TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3)     NOT NULL,
    CONSTRAINT "Gallery_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "GallerySection" (
    "id"              TEXT    NOT NULL,
    "galleryId"       TEXT    NOT NULL,
    "title"           TEXT    NOT NULL,
    "sortOrder"       INTEGER NOT NULL DEFAULT 0,
    "visibleToClient" BOOLEAN NOT NULL DEFAULT true,
    "watermarkEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GallerySection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "GalleryClient" (
    "id"             TEXT NOT NULL,
    "galleryId"      TEXT NOT NULL,
    "name"           TEXT NOT NULL,
    "email"          TEXT NOT NULL,
    "accessToken"    TEXT NOT NULL,
    "lastAccessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GalleryClient_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Photo" (
    "id"                      TEXT          NOT NULL,
    "galleryId"               TEXT          NOT NULL,
    "sectionId"               TEXT,
    "filename"                TEXT          NOT NULL,
    "originalKey"             TEXT          NOT NULL,
    "previewKey"              TEXT,
    "thumbnailKey"            TEXT,
    "watermarkedKey"          TEXT,
    "mimeType"                TEXT          NOT NULL,
    "sizeBytes"               BIGINT        NOT NULL,
    "width"                   INTEGER,
    "height"                  INTEGER,
    "status"                  "PhotoStatus" NOT NULL DEFAULT 'UPLOADING',
    "source"                  "PhotoSource" NOT NULL DEFAULT 'DASHBOARD',
    "originalFilename"        TEXT,
    "editStatus"              "EditStatus"  NOT NULL DEFAULT 'NONE',
    "finalKey"                TEXT,
    "sortOrder"               INTEGER       NOT NULL DEFAULT 0,
    "labels"                  TEXT[]        DEFAULT ARRAY[]::TEXT[],
    "appliedWatermarkPresetId" TEXT,
    "createdAt"               TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"               TIMESTAMP(3)  NOT NULL,
    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Selection" (
    "id"              TEXT               NOT NULL,
    "galleryId"       TEXT               NOT NULL,
    "galleryClientId" TEXT,
    "clientEmail"     TEXT,
    "clientName"      TEXT,
    "submittedAt"     TIMESTAMP(3),
    "workflowState"   "SelectionWorkflow" NOT NULL DEFAULT 'IN_PROGRESS',
    "createdAt"       TIMESTAMP(3)        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3)        NOT NULL,
    CONSTRAINT "Selection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SelectionItem" (
    "id"          TEXT NOT NULL,
    "selectionId" TEXT NOT NULL,
    "photoId"     TEXT NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SelectionItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Download" (
    "id"          TEXT             NOT NULL,
    "galleryId"   TEXT             NOT NULL,
    "selectionId" TEXT,
    "status"      "DownloadStatus" NOT NULL DEFAULT 'PENDING',
    "zipKey"      TEXT,
    "expiresAt"   TIMESTAMP(3),
    "createdAt"   TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Download_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "GalleryPreset" (
    "id"               TEXT          NOT NULL,
    "photographerId"   TEXT          NOT NULL,
    "name"             TEXT          NOT NULL,
    "isDefault"        BOOLEAN       NOT NULL DEFAULT false,
    "allowSelection"   BOOLEAN       NOT NULL DEFAULT true,
    "allowFavorites"   BOOLEAN       NOT NULL DEFAULT false,
    "allowComments"    BOOLEAN       NOT NULL DEFAULT false,
    "requireClientInfo" BOOLEAN      NOT NULL DEFAULT false,
    "downloadEnabled"  BOOLEAN       NOT NULL DEFAULT false,
    "downloadType"     "DownloadType" NOT NULL DEFAULT 'NONE',
    "watermarkEnabled" BOOLEAN       NOT NULL DEFAULT true,
    "expiresInDays"    INTEGER,
    "createdAt"        TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3)  NOT NULL,
    CONSTRAINT "GalleryPreset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "GalleryActivityEvent" (
    "id"        TEXT              NOT NULL,
    "galleryId" TEXT              NOT NULL,
    "eventType" "GalleryEventType" NOT NULL,
    "metadata"  JSONB,
    "createdAt" TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GalleryActivityEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Favorite" (
    "id"              TEXT NOT NULL,
    "galleryId"       TEXT NOT NULL,
    "galleryClientId" TEXT NOT NULL,
    "photoId"         TEXT NOT NULL,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Comment" (
    "id"              TEXT NOT NULL,
    "galleryId"       TEXT NOT NULL,
    "galleryClientId" TEXT NOT NULL,
    "photoId"         TEXT,
    "body"            TEXT NOT NULL,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "LightroomApiKey" (
    "id"               TEXT    NOT NULL,
    "label"            TEXT,
    "keyHash"          TEXT    NOT NULL,
    "photographerId"   TEXT    NOT NULL,
    "defaultGalleryId" TEXT,
    "active"           BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt"       TIMESTAMP(3),
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LightroomApiKey_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "WatermarkPreset" (
    "id"             TEXT               NOT NULL,
    "photographerId" TEXT               NOT NULL,
    "name"           TEXT               NOT NULL,
    "imageKey"       TEXT               NOT NULL,
    "position"       "WatermarkPosition" NOT NULL DEFAULT 'CENTER',
    "sizePct"        INTEGER            NOT NULL DEFAULT 20,
    "opacity"        INTEGER            NOT NULL DEFAULT 40,
    "isDefault"      BOOLEAN            NOT NULL DEFAULT false,
    "isActive"       BOOLEAN            NOT NULL DEFAULT true,
    "createdAt"      TIMESTAMP(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3)       NOT NULL,
    CONSTRAINT "WatermarkPreset_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key"                         ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "User_auth0Sub_key"                      ON "User"("auth0Sub");
CREATE UNIQUE INDEX IF NOT EXISTS "Plan_name_key"                          ON "Plan"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "PhotographerProfile_userId_key"         ON "PhotographerProfile"("userId");
CREATE        INDEX IF NOT EXISTS "GalleryFolder_photographerId_idx"       ON "GalleryFolder"("photographerId");
CREATE UNIQUE INDEX IF NOT EXISTS "Gallery_shareToken_key"                 ON "Gallery"("shareToken");
CREATE        INDEX IF NOT EXISTS "Gallery_photographerId_idx"             ON "Gallery"("photographerId");
CREATE        INDEX IF NOT EXISTS "Gallery_photographerId_folderId_idx"    ON "Gallery"("photographerId", "folderId");
CREATE        INDEX IF NOT EXISTS "Gallery_status_idx"                     ON "Gallery"("status");
CREATE        INDEX IF NOT EXISTS "GallerySection_galleryId_idx"           ON "GallerySection"("galleryId");
CREATE UNIQUE INDEX IF NOT EXISTS "GalleryClient_accessToken_key"          ON "GalleryClient"("accessToken");
CREATE        INDEX IF NOT EXISTS "GalleryClient_galleryId_idx"            ON "GalleryClient"("galleryId");
CREATE UNIQUE INDEX IF NOT EXISTS "GalleryClient_galleryId_email_key"      ON "GalleryClient"("galleryId", "email");
CREATE UNIQUE INDEX IF NOT EXISTS "Photo_originalKey_key"                  ON "Photo"("originalKey");
CREATE        INDEX IF NOT EXISTS "Photo_galleryId_idx"                    ON "Photo"("galleryId");
CREATE        INDEX IF NOT EXISTS "Photo_galleryId_status_idx"             ON "Photo"("galleryId", "status");
CREATE        INDEX IF NOT EXISTS "Photo_sectionId_idx"                    ON "Photo"("sectionId");
CREATE        INDEX IF NOT EXISTS "Selection_galleryId_idx"                ON "Selection"("galleryId");
CREATE        INDEX IF NOT EXISTS "Selection_galleryClientId_idx"          ON "Selection"("galleryClientId");
CREATE        INDEX IF NOT EXISTS "SelectionItem_photoId_idx"              ON "SelectionItem"("photoId");
CREATE UNIQUE INDEX IF NOT EXISTS "SelectionItem_selectionId_photoId_key"  ON "SelectionItem"("selectionId", "photoId");
CREATE        INDEX IF NOT EXISTS "Download_galleryId_idx"                 ON "Download"("galleryId");
CREATE        INDEX IF NOT EXISTS "Download_selectionId_idx"               ON "Download"("selectionId");
CREATE        INDEX IF NOT EXISTS "GalleryPreset_photographerId_idx"       ON "GalleryPreset"("photographerId");
CREATE        INDEX IF NOT EXISTS "GalleryActivityEvent_galleryId_idx"                    ON "GalleryActivityEvent"("galleryId");
CREATE        INDEX IF NOT EXISTS "GalleryActivityEvent_galleryId_eventType_idx"          ON "GalleryActivityEvent"("galleryId", "eventType");
CREATE        INDEX IF NOT EXISTS "Favorite_galleryId_idx"                 ON "Favorite"("galleryId");
CREATE        INDEX IF NOT EXISTS "Favorite_galleryClientId_idx"           ON "Favorite"("galleryClientId");
CREATE UNIQUE INDEX IF NOT EXISTS "Favorite_galleryClientId_photoId_key"   ON "Favorite"("galleryClientId", "photoId");
CREATE        INDEX IF NOT EXISTS "Comment_galleryId_idx"                  ON "Comment"("galleryId");
CREATE        INDEX IF NOT EXISTS "Comment_galleryClientId_idx"            ON "Comment"("galleryClientId");
CREATE        INDEX IF NOT EXISTS "Comment_galleryClientId_photoId_idx"    ON "Comment"("galleryClientId", "photoId");
CREATE UNIQUE INDEX IF NOT EXISTS "LightroomApiKey_keyHash_key"            ON "LightroomApiKey"("keyHash");
CREATE        INDEX IF NOT EXISTS "LightroomApiKey_photographerId_idx"     ON "LightroomApiKey"("photographerId");
CREATE        INDEX IF NOT EXISTS "LightroomApiKey_defaultGalleryId_idx"   ON "LightroomApiKey"("defaultGalleryId");
CREATE        INDEX IF NOT EXISTS "WatermarkPreset_photographerId_idx"     ON "WatermarkPreset"("photographerId");

-- Foreign keys
DO $$ BEGIN ALTER TABLE "PhotographerProfile"  ADD CONSTRAINT "PhotographerProfile_userId_fkey"       FOREIGN KEY ("userId")           REFERENCES "User"("id")              ON DELETE CASCADE  ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "PhotographerProfile"  ADD CONSTRAINT "PhotographerProfile_planId_fkey"       FOREIGN KEY ("planId")           REFERENCES "Plan"("id")              ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "GalleryFolder"        ADD CONSTRAINT "GalleryFolder_photographerId_fkey"     FOREIGN KEY ("photographerId")   REFERENCES "PhotographerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Gallery"              ADD CONSTRAINT "Gallery_photographerId_fkey"           FOREIGN KEY ("photographerId")   REFERENCES "PhotographerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Gallery"              ADD CONSTRAINT "Gallery_folderId_fkey"                 FOREIGN KEY ("folderId")         REFERENCES "GalleryFolder"("id")     ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Gallery"              ADD CONSTRAINT "Gallery_watermarkPresetId_fkey"        FOREIGN KEY ("watermarkPresetId") REFERENCES "WatermarkPreset"("id")  ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "GallerySection"       ADD CONSTRAINT "GallerySection_galleryId_fkey"         FOREIGN KEY ("galleryId")        REFERENCES "Gallery"("id")           ON DELETE CASCADE  ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "GalleryClient"        ADD CONSTRAINT "GalleryClient_galleryId_fkey"          FOREIGN KEY ("galleryId")        REFERENCES "Gallery"("id")           ON DELETE CASCADE  ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Photo"                ADD CONSTRAINT "Photo_galleryId_fkey"                  FOREIGN KEY ("galleryId")        REFERENCES "Gallery"("id")           ON DELETE CASCADE  ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Photo"                ADD CONSTRAINT "Photo_sectionId_fkey"                  FOREIGN KEY ("sectionId")        REFERENCES "GallerySection"("id")    ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Selection"            ADD CONSTRAINT "Selection_galleryId_fkey"              FOREIGN KEY ("galleryId")        REFERENCES "Gallery"("id")           ON DELETE CASCADE  ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Selection"            ADD CONSTRAINT "Selection_galleryClientId_fkey"        FOREIGN KEY ("galleryClientId")  REFERENCES "GalleryClient"("id")     ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "SelectionItem"        ADD CONSTRAINT "SelectionItem_selectionId_fkey"        FOREIGN KEY ("selectionId")      REFERENCES "Selection"("id")         ON DELETE CASCADE  ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "SelectionItem"        ADD CONSTRAINT "SelectionItem_photoId_fkey"            FOREIGN KEY ("photoId")          REFERENCES "Photo"("id")             ON DELETE CASCADE  ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Download"             ADD CONSTRAINT "Download_galleryId_fkey"               FOREIGN KEY ("galleryId")        REFERENCES "Gallery"("id")           ON DELETE CASCADE  ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Download"             ADD CONSTRAINT "Download_selectionId_fkey"             FOREIGN KEY ("selectionId")      REFERENCES "Selection"("id")         ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "GalleryPreset"        ADD CONSTRAINT "GalleryPreset_photographerId_fkey"     FOREIGN KEY ("photographerId")   REFERENCES "PhotographerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "GalleryActivityEvent" ADD CONSTRAINT "GalleryActivityEvent_galleryId_fkey"   FOREIGN KEY ("galleryId")        REFERENCES "Gallery"("id")           ON DELETE CASCADE  ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Favorite"             ADD CONSTRAINT "Favorite_galleryId_fkey"               FOREIGN KEY ("galleryId")        REFERENCES "Gallery"("id")           ON DELETE CASCADE  ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Favorite"             ADD CONSTRAINT "Favorite_galleryClientId_fkey"         FOREIGN KEY ("galleryClientId")  REFERENCES "GalleryClient"("id")     ON DELETE CASCADE  ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Favorite"             ADD CONSTRAINT "Favorite_photoId_fkey"                 FOREIGN KEY ("photoId")          REFERENCES "Photo"("id")             ON DELETE CASCADE  ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Comment"              ADD CONSTRAINT "Comment_galleryId_fkey"                FOREIGN KEY ("galleryId")        REFERENCES "Gallery"("id")           ON DELETE CASCADE  ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Comment"              ADD CONSTRAINT "Comment_galleryClientId_fkey"          FOREIGN KEY ("galleryClientId")  REFERENCES "GalleryClient"("id")     ON DELETE CASCADE  ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Comment"              ADD CONSTRAINT "Comment_photoId_fkey"                  FOREIGN KEY ("photoId")          REFERENCES "Photo"("id")             ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "LightroomApiKey"      ADD CONSTRAINT "LightroomApiKey_photographerId_fkey"   FOREIGN KEY ("photographerId")   REFERENCES "PhotographerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "LightroomApiKey"      ADD CONSTRAINT "LightroomApiKey_defaultGalleryId_fkey" FOREIGN KEY ("defaultGalleryId") REFERENCES "Gallery"("id")           ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "WatermarkPreset"      ADD CONSTRAINT "WatermarkPreset_photographerId_fkey"   FOREIGN KEY ("photographerId")   REFERENCES "PhotographerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
