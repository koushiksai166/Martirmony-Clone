-- CreateTable
CREATE TABLE "PartnerPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "minAge" INTEGER,
    "maxAge" INTEGER,
    "minHeight" INTEGER,
    "maxHeight" INTEGER,
    "religion" TEXT,
    "caste" TEXT,
    "motherTongue" TEXT,
    "education" TEXT,
    "occupation" TEXT,
    "minIncome" INTEGER,
    "maxIncome" INTEGER,
    "country" TEXT,
    "state" TEXT,
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PartnerPreference_userId_key" ON "PartnerPreference"("userId");
CREATE INDEX "PartnerPreference_country_state_city_idx" ON "PartnerPreference"("country", "state", "city");

-- AddForeignKey
ALTER TABLE "PartnerPreference" ADD CONSTRAINT "PartnerPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
