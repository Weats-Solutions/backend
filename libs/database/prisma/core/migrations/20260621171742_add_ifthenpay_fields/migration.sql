-- AlterTable
ALTER TABLE "EstablishmentIntegrations" ADD COLUMN     "ifthenpayAuthToken" TEXT,
ADD COLUMN     "ifthenpayEnabled" BOOLEAN NOT NULL DEFAULT false;
