-- AlterTable
ALTER TABLE "Establishment" ADD COLUMN     "externalLinksModule" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ExternalLink" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "ExternalLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalLinkTranslation" (
    "id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "externalLinkId" TEXT NOT NULL,

    CONSTRAINT "ExternalLinkTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExternalLinkTranslation_externalLinkId_locale_key" ON "ExternalLinkTranslation"("externalLinkId", "locale");

-- AddForeignKey
ALTER TABLE "ExternalLink" ADD CONSTRAINT "ExternalLink_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalLinkTranslation" ADD CONSTRAINT "ExternalLinkTranslation_externalLinkId_fkey" FOREIGN KEY ("externalLinkId") REFERENCES "ExternalLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
