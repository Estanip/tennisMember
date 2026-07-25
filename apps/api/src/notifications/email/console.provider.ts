import type { EmailMessage, EmailProvider } from "./types.js";

export class ConsoleEmailProvider implements EmailProvider {
  readonly name = "console";

  async send(message: EmailMessage): Promise<void> {
    console.info(
      `[socios:email:console] to=${message.to} subject=${message.subject}\n${message.text}`,
    );
  }
}
