import type { Member } from "@prisma/client";
import type { MemberDeleteReason, MemberStatus, Member as SharedMember } from "@socios/shared";
import { isMemberDeleteReason, isMemberStatus } from "@socios/shared";

export function toMemberDto(member: Member): SharedMember {
  const status: MemberStatus = isMemberStatus(member.status) ? member.status : (0 as MemberStatus);
  const deletedReason: MemberDeleteReason | null =
    member.deletedReason && isMemberDeleteReason(member.deletedReason)
      ? member.deletedReason
      : null;

  return {
    id: member.id,
    fullName: member.fullName,
    email: member.email,
    age: member.age,
    phone: member.phone,
    condition: member.condition,
    status,
    deletedReason,
    deletedReasonDetail: member.deletedReasonDetail,
    createdAt: member.createdAt.toISOString(),
    updatedAt: member.updatedAt.toISOString(),
  };
}
