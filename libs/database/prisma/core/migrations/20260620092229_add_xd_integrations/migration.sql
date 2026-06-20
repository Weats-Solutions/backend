-- AlterTable
ALTER TABLE "EstablishmentIntegrations" ADD COLUMN     "xdRestBaseUrl" TEXT,
ADD COLUMN     "xdRestEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "xdRestPassword" TEXT,
ADD COLUMN     "xdRestToken" TEXT,
ADD COLUMN     "xdRestTokenExp" TIMESTAMP(3),
ADD COLUMN     "xdRestUsername" TEXT;
