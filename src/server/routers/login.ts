import { z } from "zod";

import loginTemplate from "~/templates/login";

import { absoluteUrl } from "../../utils/absolute-url";
import { sendEmailTemplate } from "../../utils/api-utils";
import { createToken } from "../../utils/auth";
import { publicProcedure, router } from "../trpc";

export const login = router({
  login: publicProcedure
    .input(
      z.object({
        email: z.string(),
        path: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { email, path } = input;
      const homePageUrl = absoluteUrl();
      const user = ctx.session.user;

      const token = await createToken({
        email,
        guestId: user.id,
        path,
      });

      const loginUrl = `${homePageUrl}/login?code=${token}`;

      await sendEmailTemplate({
        templateString: loginTemplate,
        to: email,
        subject: "Rallly - Login",
        templateVars: {
          loginUrl,
          homePageUrl,
          supportEmail: process.env.SUPPORT_EMAIL,
        },
      });
    }),
});
