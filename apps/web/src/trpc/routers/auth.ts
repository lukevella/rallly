import { prisma } from "@rallly/database";
import { posthog } from "@rallly/posthog/server";
import { generateOtp } from "@rallly/utils/nanoid";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";

import { isEmailBlocked } from "@/auth/helpers/is-email-blocked";
import { mergeGuestsIntoUser } from "@/auth/helpers/merge-user";
import { getEmailClient } from "@/utils/emails";
import { createToken, decryptToken } from "@/utils/session";

import { createRateLimitMiddleware, publicProcedure, router } from "../trpc";
import type { RegistrationTokenPayload } from "../types";

export const auth = router({
  getUserInfo: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      }),
    )
    .mutation(async ({ input }) => {
      const count = await prisma.user.count({
        where: {
          email: input.email,
        },
      });

      return { isRegistered: count > 0 };
    }),
  requestRegistration: publicProcedure
    .use(createRateLimitMiddleware(5, "1 m"))
    .input(
      z.object({
        name: z.string().min(1).max(100),
        email: z.string().email(),
      }),
    )
    .mutation(
      async ({
        input,
        ctx,
      }): Promise<
        | { ok: true; token: string }
        | { ok: false; reason: "userAlreadyExists" | "emailNotAllowed" }
      > => {
        if (isEmailBlocked?.(input.email)) {
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

        const code = generateOtp();

        const token = await createToken<RegistrationTokenPayload>({
          name: input.name,
          email: input.email,
          code,
        });

        await getEmailClient(ctx.locale).sendTemplate("RegisterEmail", {
          to: input.email,
          props: {
            code,
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
        timeZone: z.string().optional(),
        locale: z.string().optional(),
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
          timeZone: input.timeZone,
          locale: input.locale,
        },
      });

      if (ctx.user && ctx.user.isGuest) {
        try {
          await mergeGuestsIntoUser(user.id, [ctx.user.id]);
        } catch (err) {
          Sentry.captureException(err);
        }
      }

      posthog?.capture({
        event: "register",
        distinctId: user.id,
        properties: {
          $set: {
            email: user.email,
            name: user.name,
            timeZone: input.timeZone,
            locale: input.locale,
          },
        },
      });

      return { ok: true, user };
    }),
  getUserPermission: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const res = await decryptToken<{ userId: string }>(input.token);

      if (!res) {
        return null;
      }

      return res;
    }),
});
