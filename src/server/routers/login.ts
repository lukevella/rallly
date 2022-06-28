import { z } from "zod";

import { absoluteUrl } from "../../utils/absolute-url";
import { sendEmailTemplate } from "../../utils/api-utils";
import { createToken } from "../../utils/auth";
import { createRouter } from "../createRouter";

export const login = createRouter().mutation("login", {
  input: z.object({
    email: z.string(),
    path: z.string(),
  }),
  resolve: async ({ ctx, input }) => {
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
      templateName: "login",
      to: email,
      subject: "Rallly - Login",
      templateVars: {
        loginUrl,
        homePageUrl,
      },
    });
  },
});
