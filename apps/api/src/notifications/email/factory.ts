import { ConsoleEmailProvider } from "./console.provider.js";
import { ResendEmailProvider } from "./resend.provider.js";
import type { EmailProvider } from "./types.js";

let cached: EmailProvider | null = null;

export function getEmailProvider(): EmailProvider {
  if (cached) {
    return cached;
  }

  const provider = (process.env.EMAIL_PROVIDER ?? "console").trim().toLowerCase();
  cached = provider === "resend" ? new ResendEmailProvider() : new ConsoleEmailProvider();
  return cached;
}
