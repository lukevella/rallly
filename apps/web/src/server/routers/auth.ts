import { prisma } from "@rallly/database";
import { sendEmail } from "@rallly/emails";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { absoluteUrl } from "@/utils/absolute-url";

import {
  createToken,
  decryptToken,
  LoginTokenPayload,
  mergeGuestsIntoUser,
  RegistrationTokenPayload,
} from "../../utils/auth";
import { generateOtp } from "../../utils/nanoid";
import { publicProcedure, router } from "../trpc";

const isEmailBlocked = (email: string) => {
  if (process.env.ALLOWED_EMAILS) {
    const allowedEmails = process.env.ALLOWED_EMAILS.split(",");
    // Check whether the email matches enough of the patterns specified in ALLOWED_EMAILS
    const isAllowed = allowedEmails.some((allowedEmail) => {
      const regex = new RegExp(allowedEmail.trim().replace("*", ".*"), "i");
      return regex.test(email);
    });

    if (!isAllowed) {
      return true;
    }
  }
  return false;
};

export const auth = router({
  requestRegistration: publicProcedure
    .input(
      z.object({
        name: z.string(),
        email: z.string(),
      }),
    )
    .mutation(
      async ({
        input,
      }): Promise<
        | { ok: true; token: string }
        | { ok: false; reason: "userAlreadyExists" | "emailNotAllowed" }
      > => {
        if (isEmailBlocked(input.email)) {
          return { ok: false, reason: "emailNotAllowed" };
        }

        const user = await prisma.user.findUnique({
          select: {
            id: true,
          },
          where: {
            email: input.email,
          },
        });

        if (user) {
          return { ok: false, reason: "userAlreadyExists" };
        }

        const code = await generateOtp();

        const token = await createToken<RegistrationTokenPayload>({
          name: input.name,
          email: input.email,
          code,
        });

        await sendEmail("RegisterEmail", {
          to: input.email,
          subject: "Complete your registration",
          props: {
            code,
            name: input.name,
          },
        });

        return { ok: true, token };
      },
    ),
  authenticateRegistration: publicProcedure
    .input(
      z.object({
        token: z.string(),
        code: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const payload = await decryptToken<RegistrationTokenPayload>(input.token);

      if (!payload) {
        return { user: null };
      }

      const { name, email, code } = payload;
      if (input.code !== code) {
        return { ok: false };
      }

      const user = await prisma.user.create({
        select: { id: true, name: true, email: true },
        data: {
          name,
          email,
        },
      });

      if (ctx.session.user?.isGuest) {
        await mergeGuestsIntoUser(user.id, [ctx.session.user.id]);
      }

      ctx.session.user = {
        isGuest: false,
        id: user.id,
      };

      await ctx.session.save();

      return { ok: true, user };
    }),
  requestLogin: publicProcedure
    .input(
      z.object({
        email: z.string(),
      }),
    )
    .mutation(
      async ({
        input,
      }): Promise<
        | { ok: true; token: string }
        | { ok: false; reason: "emailNotAllowed" | "userNotFound" }
      > => {
        if (isEmailBlocked(input.email)) {
          return { ok: false, reason: "emailNotAllowed" };
        }

        const user = await prisma.user.findUnique({
          where: {
            email: input.email,
          },
        });

        if (!user) {
          return { ok: false, reason: "userNotFound" };
        }

        const code = await generateOtp();

        const token = await createToken<LoginTokenPayload>({
          userId: user.id,
          code,
        });

        await sendEmail("LoginEmail", {
          to: input.email,
          subject: "Login",
          props: {
            name: user.name,
            code,
            magicLink: absoluteUrl(`/auth/login?token=${token}`),
          },
        });

        return { ok: true, token };
      },
    ),
  authenticateLogin: publicProcedure
    .input(
      z.object({
        token: z.string(),
        code: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const payload = await decryptToken<LoginTokenPayload>(input.token);

      if (!payload) {
        return { user: null };
      }

      const { userId, code } = payload;

      if (input.code !== code) {
        return { user: null };
      }

      const user = await prisma.user.findUnique({
        select: { id: true, name: true, email: true },
        where: { id: userId },
      });

      if (!user) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The user doesn't exist anymore",
        });
      }

      if (ctx.session.user?.isGuest) {
        await mergeGuestsIntoUser(user.id, [ctx.session.user.id]);
      }

      ctx.session.user = {
        isGuest: false,
        id: user.id,
      };

      await ctx.session.save();

      return { user };
    }),
});
