-- CreateEnum
CREATE TYPE "ReservationsPlataform" AS ENUM ('THEFORK', 'THREECKET');

-- AlterTable
ALTER TABLE "Establishment" ADD COLUMN     "reservationsPlatform" "ReservationsPlataform";
