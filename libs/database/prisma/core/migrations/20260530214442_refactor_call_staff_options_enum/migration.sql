-- CreateEnum
CREATE TYPE "CallStaffOption" AS ENUM ('HELP', 'CLEAN', 'BILL', 'ORDER');

-- AlterTable
ALTER TABLE "Establishment" ADD COLUMN     "callStaffOptions" "CallStaffOption"[] DEFAULT ARRAY['HELP', 'CLEAN', 'BILL', 'ORDER']::"CallStaffOption"[];
