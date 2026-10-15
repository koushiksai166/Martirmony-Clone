-- AlterEnum: Add SILVER, GOLD, PLATINUM to MembershipPlan
ALTER TYPE "MembershipPlan" ADD VALUE IF NOT EXISTS 'SILVER';
ALTER TYPE "MembershipPlan" ADD VALUE IF NOT EXISTS 'GOLD';
ALTER TYPE "MembershipPlan" ADD VALUE IF NOT EXISTS 'PLATINUM';

-- AlterTable Membership: add autoRenew and renewalAttempts
ALTER TABLE "Membership"
  ADD COLUMN "autoRenew"       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "renewalAttempts" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "Membership_autoRenew_expiresAt_idx" ON "Membership"("autoRenew", "expiresAt");

-- AlterTable Payment: add plan, refundedAmount, invoiceNumber
ALTER TABLE "Payment"
  ADD COLUMN "plan"           TEXT NOT NULL DEFAULT 'SILVER',
  ADD COLUMN "refundedAmount" INTEGER,
  ADD COLUMN "invoiceNumber"  TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Payment_invoiceNumber_key" ON "Payment"("invoiceNumber");
