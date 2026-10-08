-- CreateEnum
CREATE TYPE "MemberAuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'RESTORE');

-- CreateEnum
CREATE TYPE "MemberAuditSource" AS ENUM ('APP', 'GOOGLE_FORM', 'IMPORT');

-- CreateTable
CREATE TABLE "member_audit_log" (
    "id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "action" "MemberAuditAction" NOT NULL,
    "source" "MemberAuditSource" NOT NULL,
    "actor_user_id" TEXT,
    "actor_name" TEXT,
    "actor_email" TEXT,
    "actor_role" "UserRole",
    "before" JSONB,
    "after" JSONB NOT NULL,
    "changed_fields" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "member_audit_log_member_id_created_at_idx" ON "member_audit_log"("member_id", "created_at");

-- CreateIndex
CREATE INDEX "member_audit_log_actor_user_id_idx" ON "member_audit_log"("actor_user_id");

-- CreateIndex
CREATE INDEX "member_audit_log_created_at_idx" ON "member_audit_log"("created_at");
