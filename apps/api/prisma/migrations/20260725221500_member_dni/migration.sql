-- Test data wipe: required column dni cannot be added with existing rows
DELETE FROM "members";

-- AlterTable
ALTER TABLE "members" ADD COLUMN "dni" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "members_dni_key" ON "members"("dni");

-- CreateIndex
CREATE INDEX "members_dni_idx" ON "members"("dni");
