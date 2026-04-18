-- CreateEnum
CREATE TYPE "TaskFileType" AS ENUM ('IMAGE', 'PDF', 'TEXT', 'VIDEO', 'AUDIO', 'ARCHIVE', 'OTHER');

-- CreateTable
CREATE TABLE "TaskFile" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "uploaderId" TEXT,
    "originalName" TEXT NOT NULL,
    "storageName" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileType" "TaskFileType" NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaskFile_storageName_key" ON "TaskFile"("storageName");

-- CreateIndex
CREATE INDEX "TaskFile_taskId_idx" ON "TaskFile"("taskId");

-- CreateIndex
CREATE INDEX "TaskFile_uploaderId_idx" ON "TaskFile"("uploaderId");

-- CreateIndex
CREATE INDEX "TaskFile_fileType_idx" ON "TaskFile"("fileType");

-- CreateIndex
CREATE INDEX "TaskFile_mimeType_idx" ON "TaskFile"("mimeType");

-- CreateIndex
CREATE INDEX "TaskFile_createdAt_idx" ON "TaskFile"("createdAt");

-- AddForeignKey
ALTER TABLE "TaskFile" ADD CONSTRAINT "TaskFile_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskFile" ADD CONSTRAINT "TaskFile_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
