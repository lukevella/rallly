"use server";

import { feedbackSchema } from "@/features/feedback/schema";
import {
  authActionClient,
  createRateLimitMiddleware,
} from "@/features/safe-action/server";
import { getEmailClient } from "@/utils/emails";

export const submitFeedbackAction = authActionClient
  .metadata({
    actionName: "submit_feedback",
  })
  .use(createRateLimitMiddleware(5, "1 h"))
  .inputSchema(feedbackSchema)
  .action(async ({ ctx, parsedInput }) => {
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
