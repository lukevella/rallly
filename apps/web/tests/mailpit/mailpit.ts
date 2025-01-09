import type { MailpitListMessagesResponse, MailpitMessage } from "./types";

const MAILPIT_API_URL = "http://localhost:8025/api";

export async function getMessages(): Promise<MailpitListMessagesResponse> {
  const response = await fetch(`${MAILPIT_API_URL}/v1/messages`);
  const data = (await response.json()) as MailpitListMessagesResponse;
  return data;
}

export async function getMessage(id: string): Promise<MailpitMessage> {
  const response = await fetch(`${MAILPIT_API_URL}/v1/message/${id}`);
  const data = (await response.json()) as MailpitMessage;
  return data;
}

export async function deleteAllMessages(): Promise<void> {
  await fetch(`${MAILPIT_API_URL}/v1/messages`, {
    method: "DELETE",
  });
}

export async function captureOne(
  to: string,
  options: { wait?: number } = {},
): Promise<{ email: MailpitMessage }> {
  const startTime = Date.now();
  const timeout = options.wait ?? 5000;

  while (Date.now() - startTime < timeout) {
    const { messages } = await getMessages();
    const message = messages.find(
      (msg) =>
        new Date(msg.Created) > new Date(startTime) &&
        msg.To.some((recipient) => recipient.Address === to),
    );

    if (message) {
      const fullMessage = await getMessage(message.ID);
      return { email: fullMessage };
    }

    // Wait a bit before trying again
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
