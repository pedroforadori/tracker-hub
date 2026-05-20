-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('ATIVO', 'INATIVO');

-- AlterTable
ALTER TABLE "Customer"
  ADD COLUMN "monthlyFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN "status" "CustomerStatus" NOT NULL DEFAULT 'ATIVO';
