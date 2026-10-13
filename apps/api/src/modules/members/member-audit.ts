import { type Member, type MemberAuditLog, Prisma } from "@prisma/client";
import type {
  MemberAuditAction,
  MemberAuditEntry,
  MemberAuditSnapshot,
  MemberAuditSource,
  UserRole,
} from "@socios/shared";
import { isMemberDeleteReason, isUserRole } from "@socios/shared";
import type { JwtPayload } from "../../plugins/auth.js";

export interface MemberActor {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface MemberAuditContext {
  source: MemberAuditSource;
  actor: MemberActor | null;
}

const IGNORED_DIFF_FIELDS: ReadonlySet<keyof MemberAuditSnapshot> = new Set(["updatedAt"]);

export function memberActorFromJwt(user: JwtPayload): MemberActor {
  return { userId: user.sub, name: user.name, email: user.email, role: user.role };
}

function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function toMemberAuditSnapshot(member: Member): MemberAuditSnapshot {
  return {
    id: member.id,
    memberId: member.memberId,
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    dni: member.dni,
    birthDate: toIsoDate(member.birthDate),
    phone: member.phone,
    condition: member.condition,
    status: member.status,
    deletedAt: member.deletedAt ? member.deletedAt.toISOString() : null,
    deletedReason:
      member.deletedReason && isMemberDeleteReason(member.deletedReason)
        ? member.deletedReason
        : null,
    deletedReasonDetail: member.deletedReasonDetail,
    createdAt: member.createdAt.toISOString(),
    updatedAt: member.updatedAt.toISOString(),
  };
}

export function diffMemberSnapshots(
  before: MemberAuditSnapshot | null,
  after: MemberAuditSnapshot,
): string[] {
  const keys = Object.keys(after) as (keyof MemberAuditSnapshot)[];
  return keys.filter(
    (key) => !IGNORED_DIFF_FIELDS.has(key) && (before === null || before[key] !== after[key]),
  );
}

/**
 * Writes one audit entry inside the caller's transaction.
 * UPDATE entries with no effective change are skipped; returns whether an entry was written.
 */
export async function recordMemberAudit(
  tx: Prisma.TransactionClient,
  params: {
    action: MemberAuditAction;
    before: Member | null;
    after: Member;
    context: MemberAuditContext;
  },
): Promise<boolean> {
  const before = params.before ? toMemberAuditSnapshot(params.before) : null;
  const after = toMemberAuditSnapshot(params.after);
  const changedFields = diffMemberSnapshots(before, after);

  if (params.action === "UPDATE" && changedFields.length === 0) {
    return false;
  }

  const { actor, source } = params.context;
  await tx.memberAuditLog.create({
    data: {
      memberId: params.after.id,
      action: params.action,
      source,
      actorUserId: actor?.userId ?? null,
      actorName: actor?.name ?? null,
      actorEmail: actor?.email ?? null,
      actorRole: actor?.role ?? null,
      before: before ?? Prisma.DbNull,
      after,
      changedFields,
    },
  });
  return true;
}

export function toMemberAuditEntryDto(entry: MemberAuditLog): MemberAuditEntry {
  return {
    id: entry.id,
    memberId: entry.memberId,
    action: entry.action,
    source: entry.source,
    actor: entry.actorUserId
      ? {
          userId: entry.actorUserId,
          name: entry.actorName,
          email: entry.actorEmail,
          role: entry.actorRole && isUserRole(entry.actorRole) ? entry.actorRole : null,
        }
      : null,
    before: entry.before as MemberAuditSnapshot | null,
    after: entry.after as MemberAuditSnapshot,
    changedFields: entry.changedFields,
    createdAt: entry.createdAt.toISOString(),
  };
}
