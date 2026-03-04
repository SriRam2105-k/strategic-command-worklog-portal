/*
  Warnings:

  - You are about to drop the column `feedback` on the `PeerReview` table. All the data in the column will be lost.
  - Added the required column `studentFeedback` to the `PeerReview` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teamFeedback` to the `PeerReview` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PeerReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reviewerId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "studentRating" INTEGER NOT NULL,
    "teamRating" INTEGER NOT NULL,
    "studentFeedback" TEXT NOT NULL,
    "teamFeedback" TEXT NOT NULL,
    "reviewMethod" TEXT NOT NULL,
    CONSTRAINT "PeerReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PeerReview_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PeerReview" ("date", "id", "reviewMethod", "reviewerId", "studentId", "studentRating", "teamId", "teamRating") SELECT "date", "id", "reviewMethod", "reviewerId", "studentId", "studentRating", "teamId", "teamRating" FROM "PeerReview";
DROP TABLE "PeerReview";
ALTER TABLE "new_PeerReview" RENAME TO "PeerReview";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
