import { prisma } from "@rallly/database";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import { generateOtp } from "@rallly/utils/nanoid";
import NodemailerProvider from "next-auth/providers/nodemailer";

import { getEmailClient } from "@/utils/emails";

export const EmailProvider = NodemailerProvider({
  server: "none", // This value is required even though we don't need it
  from: process.env.NOREPLY_EMAIL,
  id: "email",
  generateVerificationToken() {
    return generateOtp();
  },
  async sendVerificationRequest({ identifier: email, token, url }) {
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        name: true,
        locale: true,
      },
    });

    if (user) {
      await getEmailClient(user.locale ?? undefined).sendTemplate(
        "LoginEmail",
        {
          to: email,
          props: {
            magicLink: absoluteUrl("/auth/login", {
              magicLink: url,
            }),
            code: token,
          },
        },
      );
    }
  },
});
