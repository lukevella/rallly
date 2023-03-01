import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { prisma } from "@/utils/prisma";
import emailTemplate from "~/templates/email-verification";

import { absoluteUrl } from "../../utils/absolute-url";
import { sendEmailTemplate } from "../../utils/api-utils";
import {
  createToken,
  decryptToken,
  LoginTokenPayload,
  mergeGuestsIntoUser,
  RegistrationTokenPayload,
} from "../../utils/auth";
import { generateOtp } from "../../utils/nanoid";
import { publicProcedure, router } from "../trpc";

const sendVerificationEmail = async (
  email: string,
  name: string,
  code: string,
) => {
  await sendEmailTemplate({
    to: email,
    subject: `Your 6-digit code is: ${code}`,
    templateString: emailTemplate,
    templateVars: {
      homePageUrl: absoluteUrl(),
      code,
      name,
    },
  });
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
        { ok: true; token: string } | { ok: false; code: "userAlreadyExists" }
      > => {
        const user = await prisma.user.findUnique({
          select: {
            id: true,
          },
          where: {
            email: input.email,
          },
        });

        if (user) {
          return { ok: false, code: "userAlreadyExists" };
        }

        const code = await generateOtp();

        const token = await createToken<RegistrationTokenPayload>({
          name: input.name,
          email: input.email,
          code,
        });

        await sendVerificationEmail(input.email, input.name, code);

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
      const { name, email, code } =
        await decryptToken<RegistrationTokenPayload>(input.token);

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
    .mutation(async ({ input }): Promise<{ token?: string }> => {
      const user = await prisma.user.findUnique({
        where: {
          email: input.email,
        },
      });

      if (!user) {
        return { token: undefined };
      }

      const code = await generateOtp();

      const token = await createToken<LoginTokenPayload>({
        userId: user.id,
        code,
      });

      await sendVerificationEmail(input.email, user.name, code);

      return { token };
    }),
  authenticateLogin: publicProcedure
    .input(
      z.object({
        token: z.string(),
        code: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { userId, code } = await decryptToken<LoginTokenPayload>(
        input.token,
      );

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
