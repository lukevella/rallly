import { z } from "zod";
import { absoluteUrl } from "../../utils/absolute-url";
import { sendEmailTemplate } from "../../utils/api-utils";
import { createToken } from "../../utils/auth";
import { createRouter } from "../createRouter";

export const login = t.router({
    login: t.procedure.input(z.object({
        email: z.string(),
        path: z.string(),
      })).mutation(async ({ ctx, input }) => {
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
})
;
