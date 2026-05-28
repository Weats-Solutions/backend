/*
  Warnings:

  - A unique constraint covering the columns `[servicePointId]` on the table `QrCode` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "QrCode" ADD COLUMN     "onlyShowOpenMenus" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "requireOpenEstablishment" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "_QrCodeMenus" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_QrCodeMenus_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_QrCodeMenus_B_index" ON "_QrCodeMenus"("B");

-- CreateIndex
CREATE UNIQUE INDEX "QrCode_servicePointId_key" ON "QrCode"("servicePointId");

-- AddForeignKey
ALTER TABLE "_QrCodeMenus" ADD CONSTRAINT "_QrCodeMenus_A_fkey" FOREIGN KEY ("A") REFERENCES "Menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_QrCodeMenus" ADD CONSTRAINT "_QrCodeMenus_B_fkey" FOREIGN KEY ("B") REFERENCES "QrCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
