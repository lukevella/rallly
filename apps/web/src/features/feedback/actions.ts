"use server";

import {
  authActionClient,
  createRateLimitMiddleware,
} from "@/lib/safe-action/server";
import { submitFeedback } from "./mutations";
import { feedbackSchema } from "./schema";

export const submitFeedbackAction = authActionClient
  .metadata({ actionName: "submit_feedback" })
  .use(createRateLimitMiddleware({ requests: 5, duration: "1 h", by: "user" }))
  .inputSchema(feedbackSchema)
  .action(async ({ ctx, parsedInput }) => {
    await submitFeedback({
      userId: ctx.user.id,
      userName: ctx.user.name,
      userEmail: ctx.user.email,
      content: parsedInput.content,
    });
  });
