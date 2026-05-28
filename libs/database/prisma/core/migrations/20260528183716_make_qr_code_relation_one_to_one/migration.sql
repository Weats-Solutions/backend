/*
  Warnings:

  - You are about to drop the column `onlyShowOpenMenus` on the `QrCode` table. All the data in the column will be lost.
  - You are about to drop the column `requireOpenEstablishment` on the `QrCode` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "QrCode" DROP COLUMN "onlyShowOpenMenus",
DROP COLUMN "requireOpenEstablishment",
ADD COLUMN     "requireOpenMenus" BOOLEAN NOT NULL DEFAULT true;
