-- AlterTable Profile: add GPS coordinates for radius search
ALTER TABLE "Profile"
  ADD COLUMN "latitude"  DOUBLE PRECISION,
  ADD COLUMN "longitude" DOUBLE PRECISION;

-- CreateTable SavedSearch
CREATE TABLE "SavedSearch" (
  "id"           TEXT NOT NULL,
  "userId"       TEXT NOT NULL,
  "name"         TEXT NOT NULL,
  "filters"      JSONB NOT NULL,
  "alertEnabled" BOOLEAN NOT NULL DEFAULT true,
  "lastAlertAt"  TIMESTAMP(3),
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SavedSearch_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SavedSearch_userId_idx"              ON "SavedSearch"("userId");
CREATE INDEX "SavedSearch_alertEnabled_lastAlertAt_idx" ON "SavedSearch"("alertEnabled", "lastAlertAt");

ALTER TABLE "SavedSearch" ADD CONSTRAINT "SavedSearch_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
