-- Test wipe: replace fullName with firstName + lastName
DELETE FROM "members";

DROP INDEX IF EXISTS "members_fullName_idx";

ALTER TABLE "members" DROP COLUMN "fullName";

ALTER TABLE "members" ADD COLUMN "firstName" TEXT NOT NULL;
ALTER TABLE "members" ADD COLUMN "lastName" TEXT NOT NULL;

CREATE INDEX "members_firstName_idx" ON "members"("firstName");
CREATE INDEX "members_lastName_idx" ON "members"("lastName");
