export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type EmailProvider = {
  readonly name: string;
  send(message: EmailMessage): Promise<void>;
};
