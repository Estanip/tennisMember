-- Allow members without email (unique when set; multiple NULL ok in PostgreSQL)
ALTER TABLE "members" ALTER COLUMN "email" DROP NOT NULL;
