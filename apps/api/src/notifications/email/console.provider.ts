import { getLogger } from "../../lib/logger.js";
import type { EmailMessage, EmailProvider } from "./types.js";

const log = getLogger("email");

export class ConsoleEmailProvider implements EmailProvider {
  readonly name = "console";

  async send(message: EmailMessage): Promise<void> {
    log.info(
      { to: message.to, subject: message.subject, provider: "console" },
      `Console email:\n${message.text}`,
    );
  }
}
