"use server";

import {
  authActionClient,
  createRateLimitMiddleware,
} from "@/lib/safe-action/server";
import { submitFeedback } from "./mutations";
import { feedbackSchema } from "./schema";

export const submitFeedbackAction = authActionClient
  .metadata({ actionName: "submit_feedback" })
  .use(createRateLimitMiddleware(5, "1 h"))
  .inputSchema(feedbackSchema)
  .action(async ({ ctx, parsedInput }) => {
    await submitFeedback({
      userId: ctx.user.id,
      userName: ctx.user.name,
      userEmail: ctx.user.email,
      content: parsedInput.content,
    });
  });
