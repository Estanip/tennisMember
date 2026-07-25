-- CreateEnum
CREATE TYPE "MemberDeleteReason" AS ENUM ('FALTA_DE_PAGO', 'BAJA_DE_SOCIO', 'OTRA');

-- AlterTable
ALTER TABLE "members" ADD COLUMN     "deletedReason" "MemberDeleteReason",
ADD COLUMN     "deletedReasonDetail" TEXT;
