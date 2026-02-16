export interface MailpitAttachment {
  ContentID: string;
  ContentType: string;
  FileName: string;
  PartID: string;
  Size: number;
}

export interface MailpitEmailAddress {
  Address: string;
  Name: string;
}

export interface MailpitMessageSummary {
  Attachments: number;
  Bcc: MailpitEmailAddress[];
  Cc: MailpitEmailAddress[];
  Created: string;
  From: MailpitEmailAddress;
  ID: string;
  MessageID: string;
  Read: boolean;
  ReplyTo: MailpitEmailAddress[];
  Size: number;
  Snippet: string;
  Subject: string;
  Tags: string[];
  To: MailpitEmailAddress[];
}

export interface MailpitMessage extends MailpitMessageSummary {
  HTML: string;
  Text: string;
  Inline: MailpitAttachment[];
  ReturnPath: string;
  Date: string;
}

export interface MailpitListMessagesResponse {
  messages: MailpitMessageSummary[];
  messages_count: number;
  start: number;
  tags: string[];
  total: number;
  unread: number;
}

const MAILPIT_API_URL =
  process.env.MAILPIT_API_URL ?? "http://localhost:8025/api";

export async function getMessages(): Promise<MailpitListMessagesResponse> {
  const response = await fetch(`${MAILPIT_API_URL}/v1/messages`);
  const data = (await response.json()) as MailpitListMessagesResponse;
  return data;
}

export async function getMessage(id: string): Promise<MailpitMessage> {
  const response = await fetch(`${MAILPIT_API_URL}/v1/message/${id}`);
  const data = (await response.json()) as MailpitMessage;
  await markMessageAsRead(id);
  return data;
}

export async function deleteAllMessages(): Promise<void> {
  await fetch(`${MAILPIT_API_URL}/v1/messages`, {
    method: "DELETE",
  });
}

async function markMessageAsRead(id: string): Promise<void> {
  await fetch(`${MAILPIT_API_URL}/v1/messages`, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "PUT",
    body: JSON.stringify({ IDs: [id], Read: true }),
  });
}

export async function captureOne(
  to: string,
  options: { wait?: number } = {},
): Promise<{ email: MailpitMessage }> {
  const timeout = options.wait ?? 5000;
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    const { messages } = await getMessages();

    const message = messages
      .reverse()
      .find(
        (msg) =>
          msg.To.some((recipient) => recipient.Address === to) && !msg.Read,
      );

    if (message) {
      const fullMessage = await getMessage(message.ID);
      return { email: fullMessage };
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(`No email received for ${to} within ${timeout}ms`);
}

export async function captureEmailHTML(to: string): Promise<string> {
  const { email } = await captureOne(to);
  if (!email.HTML) {
    throw new Error("Email doesn't contain HTML");
  }
  return email.HTML;
}
