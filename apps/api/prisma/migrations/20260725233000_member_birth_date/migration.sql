-- Test wipe: replace age with required birthDate
DELETE FROM "members";

ALTER TABLE "members" DROP COLUMN "age";

ALTER TABLE "members" ADD COLUMN "birthDate" DATE NOT NULL;
