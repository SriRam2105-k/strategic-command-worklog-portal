-- CreateTable
CREATE TABLE "ArchiveItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "addedBy" TEXT NOT NULL,
    "timestamp" TEXT NOT NULL
);
