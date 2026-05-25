// Email stub. Logs to console with a clear [EMAIL] prefix. A real provider
// (Resend, SES, etc.) drops in behind this same interface later.
//
// The log line is `[EMAIL] To: <to> | <body>` so the magic-link route can
// produce exactly `[EMAIL] To: <email> | Link: <url>` by setting the body.

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
}

/** "Send" an email by logging it. Async to match a real provider's signature. */
export async function sendEmail({ to, subject, body }: EmailMessage): Promise<void> {
  console.log(`[EMAIL] To: ${to} | ${body}`);
  // subject is carried for the real provider; omitted from the dev log line.
  void subject;
}
