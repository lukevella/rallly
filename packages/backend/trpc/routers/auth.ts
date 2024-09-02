import { prisma } from "@rallly/database";
import { z } from "zod";

import { createToken, decryptToken } from "../../session";
import { generateOtp } from "../../utils/nanoid";
import { publicProcedure, rateLimitMiddleware, router } from "../trpc";
import { RegistrationTokenPayload } from "../types";

export const auth = router({
  requestRegistration: publicProcedure
    .use(rateLimitMiddleware)
    .input(
      z.object({
        name: z.string().nonempty().max(100),
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
        if (ctx.isEmailBlocked?.(input.email)) {
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

        await ctx.user.getEmailClient().sendTemplate("RegisterEmail", {
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

      ctx.posthogClient?.capture({
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
