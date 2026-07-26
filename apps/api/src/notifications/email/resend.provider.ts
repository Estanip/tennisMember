import { getLogger } from "../../lib/logger.js";
import type { EmailMessage, EmailProvider } from "./types.js";

const RESEND_TIMEOUT_MS = 10_000;
const log = getLogger("email");

export class ResendEmailProvider implements EmailProvider {
  readonly name = "resend";

  async send(message: EmailMessage): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey) {
      log.error("RESEND_API_KEY is required when EMAIL_PROVIDER=resend");
      throw new Error("RESEND_API_KEY is required when EMAIL_PROVIDER=resend");
    }

    const from = process.env.EMAIL_FROM?.trim();
    if (!from) {
      log.error("EMAIL_FROM is required when EMAIL_PROVIDER=resend");
      throw new Error("EMAIL_FROM is required when EMAIL_PROVIDER=resend");
    }

    log.debug({ to: message.to, subject: message.subject }, "Sending email via Resend");

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html,
      }),
      signal: AbortSignal.timeout(RESEND_TIMEOUT_MS),
    });

    if (!response.ok) {
      const body = await response.text();
      log.warn({ to: message.to, status: response.status, body }, "Resend API returned error");
      throw new Error(`Resend error ${response.status}: ${body}`);
    }

    log.debug({ to: message.to }, "Resend accepted email");
  }
}
