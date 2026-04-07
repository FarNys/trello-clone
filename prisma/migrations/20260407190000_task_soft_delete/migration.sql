-- AlterEnum
ALTER TYPE "TaskActivityType" ADD VALUE IF NOT EXISTS 'DELETED';
ALTER TYPE "TaskActivityType" ADD VALUE IF NOT EXISTS 'RESTORED';

-- AlterTable
ALTER TABLE "Task" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Task_deletedAt_idx" ON "Task"("deletedAt");
