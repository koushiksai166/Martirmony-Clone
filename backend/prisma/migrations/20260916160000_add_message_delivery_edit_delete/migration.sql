-- AlterTable: add delivery receipt, edit timestamp, and soft-delete to Message
ALTER TABLE "Message"
  ADD COLUMN "deliveredAt" TIMESTAMP(3),
  ADD COLUMN "editedAt"    TIMESTAMP(3),
  ADD COLUMN "deletedAt"   TIMESTAMP(3);
