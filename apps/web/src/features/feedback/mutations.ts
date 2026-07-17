import "server-only";

import { sendRawEmail } from "@rallly/emails";
import { track } from "@/lib/posthog";

export async function submitFeedback({
  userId,
  userName,
  userEmail,
  content,
}: {
  userId: string;
  userName: string;
  userEmail: string;
  content: string;
}) {
  await sendRawEmail({
    to: "feedback@rallly.co",
    replyTo: userEmail,
    subject: "Feedback",
    text: `User: ${userName} (${userEmail})\n\n${content}`,
  });

  // Feedback is only reachable through authActionClient, which rejects guests.
  track({ id: userId, isGuest: false }, { event: "feedback_send" });
}
