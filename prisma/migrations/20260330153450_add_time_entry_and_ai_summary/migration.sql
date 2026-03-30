-- AlterTable: add aiSummary to TaskAssignment
ALTER TABLE "TaskAssignment" ADD COLUMN "aiSummary" TEXT;

-- CreateTable: TimeEntry
CREATE TABLE "TimeEntry" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: unique per (taskId, userId)
CREATE UNIQUE INDEX "TimeEntry_taskId_userId_key" ON "TimeEntry"("taskId", "userId");

-- AddForeignKey: TimeEntry -> TaskAssignment
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "TaskAssignment"("taskId")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: TimeEntry -> User
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
