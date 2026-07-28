import type { Member } from "@prisma/client";
import type { MemberDeleteReason, MemberStatus, Member as SharedMember } from "@socios/shared";
import {
  formatMemberFullName,
  getMemberAge,
  getMemberAgeCategory,
  isMemberDeleteReason,
  isMemberStatus,
} from "@socios/shared";

function toIsoDate(value: Date): string {
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}-${String(value.getUTCDate()).padStart(2, "0")}`;
}

export function toMemberDto(member: Member): SharedMember {
  const status: MemberStatus = isMemberStatus(member.status) ? member.status : (0 as MemberStatus);
  const deletedReason: MemberDeleteReason | null =
    member.deletedReason && isMemberDeleteReason(member.deletedReason)
      ? member.deletedReason
      : null;
  const birthDate = toIsoDate(member.birthDate);
  const age = getMemberAge(birthDate);

  return {
    id: member.id,
    memberId: member.memberId,
    firstName: member.firstName,
    lastName: member.lastName,
    fullName: formatMemberFullName(member.firstName, member.lastName),
    email: member.email,
    dni: member.dni,
    birthDate,
    age,
    ageCategory: getMemberAgeCategory(age),
    phone: member.phone,
    condition: member.condition,
    status,
    deletedReason,
    deletedReasonDetail: member.deletedReasonDetail,
    createdAt: member.createdAt.toISOString(),
    updatedAt: member.updatedAt.toISOString(),
  };
}
