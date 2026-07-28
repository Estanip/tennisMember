-- Optional unique external member id (legacy / other DB)
ALTER TABLE "members" ADD COLUMN "member_id" TEXT;

CREATE UNIQUE INDEX "members_member_id_key" ON "members"("member_id");
