/*
  Warnings:

  - Added the required column `odaiId` to the `Vote` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Vote" ADD COLUMN     "odaiId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_odaiId_fkey" FOREIGN KEY ("odaiId") REFERENCES "Odai"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
