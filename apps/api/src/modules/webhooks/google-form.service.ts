import type { GoogleFormMemberPayload, Member } from "@socios/shared";
import { MEMBER_CONDITIONS, MEMBER_STATUS } from "@socios/shared";
import { AppError } from "../../lib/errors.js";
import { getLogger } from "../../lib/logger.js";
import { MemberService } from "../members/member.service.js";

const log = getLogger("webhook");

export class GoogleFormWebhookService {
  constructor(private readonly members: MemberService = new MemberService()) {}

  assertSecret(provided: string | undefined): void {
    const expected = process.env.GOOGLE_FORM_WEBHOOK_SECRET;
    if (!expected) {
      log.error("GOOGLE_FORM_WEBHOOK_SECRET is not configured");
      throw new AppError("Webhook secret is not configured", 500, "WEBHOOK_SECRET_MISSING");
    }
    if (!provided || provided !== expected) {
      log.warn("Google Form webhook rejected: invalid secret");
      throw new AppError("Invalid webhook secret", 401, "UNAUTHORIZED");
    }
  }

  async createFromForm(payload: GoogleFormMemberPayload): Promise<Member> {
    const phone = payload.phone.trim();
    if (!phone) {
      log.warn({ email: payload.email }, "Google Form payload missing phone");
      throw new AppError("Phone is required for Google Form submissions", 400, "PHONE_REQUIRED");
    }

    log.info(
      { email: payload.email, dni: payload.dni, firstName: payload.firstName },
      "Processing Google Form member submission",
    );

    const member = await this.members.create(
      {
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        dni: payload.dni,
        birthDate: payload.birthDate,
        phone,
        condition: MEMBER_CONDITIONS.ABONADO_TENIS,
        status: MEMBER_STATUS.ENABLED,
      },
      { source: "GOOGLE_FORM" },
    );

    log.info({ memberId: member.id, email: member.email }, "Google Form member created as enabled");
    return member;
  }
}
