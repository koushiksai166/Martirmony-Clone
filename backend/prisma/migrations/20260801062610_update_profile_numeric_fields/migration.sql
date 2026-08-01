/*
  Warnings:

  - The `annualIncome` column on the `Profile` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `height` on the `Profile` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "height",
ADD COLUMN     "height" INTEGER NOT NULL,
DROP COLUMN "annualIncome",
ADD COLUMN     "annualIncome" INTEGER;
