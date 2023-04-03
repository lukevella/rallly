import { prisma } from "@rallly/database";
import { sendRawEmail } from "@rallly/emails";
import { z } from "zod";

import { publicProcedure, router } from "../trpc";

export const feedback = router({
  send: publicProcedure
    .input(z.object({ content: z.string() }))
    .mutation(async ({ input, ctx }) => {
      let replyTo: string | undefined;
      let name = "Guest";

      if (!ctx.user.isGuest) {
        const user = await prisma.user.findUnique({
          where: { id: ctx.user.id },
          select: { email: true, name: true },
        });

        if (user) {
          replyTo = user.email;
          name = user.name;
        }
      }

      await sendRawEmail({
        to: process.env.NEXT_PUBLIC_FEEDBACK_EMAIL,
        from: {
          name: "Rallly Feedback Form",
          address: process.env.SUPPORT_EMAIL ?? "",
        },
        subject: "Feedback",
        replyTo,
        text: `${name} says:\n\n${input.content}`,
      });
    }),
});
