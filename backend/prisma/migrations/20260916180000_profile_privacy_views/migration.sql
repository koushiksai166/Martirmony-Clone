-- AlterTable Profile: add privacy and tracking fields
ALTER TABLE "Profile"
  ADD COLUMN "phoneNumber"     TEXT,
  ADD COLUMN "visibilityMode"  TEXT NOT NULL DEFAULT 'PUBLIC',
  ADD COLUMN "lastActiveAt"    TIMESTAMP(3);

-- CreateTable ProfileView
CREATE TABLE "ProfileView" (
  "id"        TEXT NOT NULL,
  "viewerId"  TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "viewedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ProfileView_pkey" PRIMARY KEY ("id")
);

-- Unique: one record per viewer-profile pair
CREATE UNIQUE INDEX "ProfileView_viewerId_profileId_key" ON "ProfileView"("viewerId", "profileId");

-- Index for fast profile view timeline queries
CREATE INDEX "ProfileView_profileId_viewedAt_idx" ON "ProfileView"("profileId", "viewedAt");

-- AddForeignKey
ALTER TABLE "ProfileView" ADD CONSTRAINT "ProfileView_profileId_fkey"
  FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
