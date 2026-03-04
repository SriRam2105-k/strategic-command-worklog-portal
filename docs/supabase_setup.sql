-- Supabase Setup SQL Script
-- This script creates the tables and relationships defined in the Prisma schema.
-- Execute this in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Create Project Table
CREATE TABLE IF NOT EXISTS "Project" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL -- ACTIVE, ARCHIVED
);

-- 2. Create Team Table
CREATE TABLE IF NOT EXISTS "Team" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "projectId" UUID REFERENCES "Project"("id") ON DELETE SET NULL
);

-- 3. Create User Table
CREATE TABLE IF NOT EXISTS "User" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "rollNumber" TEXT UNIQUE NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL, -- ADMIN, STUDENT
    "teamId" UUID REFERENCES "Team"("id") ON DELETE SET NULL,
    "status" TEXT NOT NULL, -- ONLINE, OFFLINE, PRESENT, ABSENT, OD
    "lastLogin" TEXT -- ISO string
);

-- 4. Create Milestone Table
CREATE TABLE IF NOT EXISTS "Milestone" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "projectId" UUID NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
    "label" TEXT NOT NULL,
    "isCompleted" BOOLEAN DEFAULT FALSE,
    "priority" TEXT NOT NULL -- CRITICAL, NORMAL, LOW
);

-- 5. Create Worklog Table
CREATE TABLE IF NOT EXISTS "Worklog" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "studentId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "projectId" UUID NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
    "date" TEXT NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL, -- SUBMITTED, REVIEWED
    "timestamp" TEXT NOT NULL -- ISO string
);

-- 6. Create Attendance Table
CREATE TABLE IF NOT EXISTS "Attendance" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "studentId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "date" TEXT NOT NULL,
    "status" TEXT NOT NULL, -- PRESENT, ABSENT, OD...
    "loginTime" TEXT NOT NULL,
    "logoutTime" TEXT,
    "sessionDuration" DOUBLE PRECISION
);

-- 7. Create Message Table
CREATE TABLE IF NOT EXISTS "Message" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "senderId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "recipientId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "senderRole" TEXT NOT NULL,
    "recipientRole" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "timestamp" TEXT NOT NULL,
    "status" TEXT NOT NULL, -- READ, UNREAD
    "attachmentUrl" TEXT
);

-- 8. Create Notification Table
CREATE TABLE IF NOT EXISTS "Notification" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID REFERENCES "User"("id") ON DELETE CASCADE,
    "type" TEXT NOT NULL, -- success, warning, error, info, admin
    "priority" TEXT NOT NULL, -- high, medium, low
    "message" TEXT NOT NULL,
    "actionTab" TEXT,
    "actionLabel" TEXT,
    "isRead" BOOLEAN DEFAULT FALSE,
    "timestamp" TEXT NOT NULL,
    "actionRequired" BOOLEAN DEFAULT FALSE
);

-- 9. Create AuditLog Table
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "userName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "timestamp" TEXT NOT NULL
);

-- 10. Create PeerReview Table
CREATE TABLE IF NOT EXISTS "PeerReview" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "reviewerId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "studentId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "teamId" TEXT NOT NULL, -- Note: matching Prisma schema's String type
    "date" TEXT NOT NULL,
    "studentRating" INTEGER NOT NULL,
    "teamRating" INTEGER NOT NULL,
    "studentFeedback" TEXT NOT NULL,
    "teamFeedback" TEXT NOT NULL,
    "reviewMethod" TEXT NOT NULL -- FACE_TO_FACE, CALL, CHAT, COMBINED
);

-- 11. Create ArchiveItem Table
CREATE TABLE IF NOT EXISTS "ArchiveItem" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL, -- MANUAL, ASSET, PROTOCOL
    "url" TEXT NOT NULL,
    "addedBy" TEXT NOT NULL,
    "timestamp" TEXT NOT NULL -- ISO string
);

-------------------------------------------------------------------------------
-- CONNECTION INSTRUCTIONS
-------------------------------------------------------------------------------
-- 1. Go to your Supabase Project Settings -> Database.
-- 2. Copy the "Connection string" (URI) from the "Transaction Pooler" section.
-- 3. In your project's `server/.env` file, update the `DATABASE_URL`:
--    DATABASE_URL="postgresql://postgres.[your-project-id]:[your-password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
--
-- Note: Replace [your-password] with your database password.
-- If you are using Prisma, adding `?pgbouncer=true` is recommended for Supabase.
-------------------------------------------------------------------------------
