"use server";

import { feedbackSchema } from "@/features/feedback/schema";
import { authActionClient } from "@/features/safe-action/server";
import { getEmailClient } from "@/utils/emails";
import { rateLimit } from "../rate-limit";

export const submitFeedbackAction = authActionClient
  .metadata({
    actionName: "submitFeedback",
  })
  .inputSchema(feedbackSchema)
  .action(async ({ ctx, parsedInput }) => {
    const { success } = await rateLimit("submitFeedback", 3, "1h");

    if (!success) {
      return {
        error: "Rate limit exceeded" as const,
      };
    }

    try {
      const { content } = parsedInput;
      getEmailClient().sendEmail({
        to: "feedback@rallly.co",
        subject: "Feedback",
        text: `User: ${ctx.user.name} (${ctx.user.email})\n\n${content}`,
      });
      return {
        success: true,
      };
    } catch {
      return {
        error: "Invalid Form Data" as const,
      };
    }
  });
