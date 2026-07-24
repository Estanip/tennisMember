import type { Member } from "@prisma/client";
import type { MemberStatus, Member as SharedMember } from "@socios/shared";
import { isMemberStatus } from "@socios/shared";

export function toMemberDto(member: Member): SharedMember {
  const status: MemberStatus = isMemberStatus(member.status) ? member.status : (0 as MemberStatus);

  return {
    id: member.id,
    fullName: member.fullName,
    email: member.email,
    age: member.age,
    phone: member.phone,
    condition: member.condition,
    status,
    createdAt: member.createdAt.toISOString(),
    updatedAt: member.updatedAt.toISOString(),
  };
}
