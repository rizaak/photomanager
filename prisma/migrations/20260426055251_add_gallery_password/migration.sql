-- CreateEnum
CREATE TYPE "DownloadStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED');

-- AlterTable
ALTER TABLE "Download" ADD COLUMN     "status" "DownloadStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "zipKey" TEXT;

-- AlterTable
ALTER TABLE "Gallery" ADD COLUMN     "password" TEXT;
