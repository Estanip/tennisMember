import type { GoogleFormMemberPayload, Member } from "@socios/shared";
import { MEMBER_CONDITIONS, MEMBER_STATUS } from "@socios/shared";
import { AppError } from "../../lib/errors.js";
import { MemberService } from "../members/member.service.js";

export class GoogleFormWebhookService {
  constructor(private readonly members: MemberService = new MemberService()) {}

  assertSecret(provided: string | undefined): void {
    const expected = process.env.GOOGLE_FORM_WEBHOOK_SECRET;
    if (!expected) {
      throw new AppError("Webhook secret is not configured", 500, "WEBHOOK_SECRET_MISSING");
    }
    if (!provided || provided !== expected) {
      throw new AppError("Invalid webhook secret", 401, "UNAUTHORIZED");
    }
  }

  async createFromForm(payload: GoogleFormMemberPayload): Promise<Member> {
    const phone = payload.phone.trim();
    if (!phone) {
      throw new AppError("Phone is required for Google Form submissions", 400, "PHONE_REQUIRED");
    }

    return this.members.create({
      fullName: payload.fullName,
      email: payload.email,
      age: payload.age,
      phone,
      condition: MEMBER_CONDITIONS.ABONADO_TENIS,
      status: MEMBER_STATUS.PENDING,
    });
  }
}
