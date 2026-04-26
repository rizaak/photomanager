-- AlterTable: add allowSelection flag to Gallery (default true = existing galleries keep selection enabled)
ALTER TABLE "Gallery" ADD COLUMN "allowSelection" BOOLEAN NOT NULL DEFAULT true;
