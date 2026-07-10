import { zValidator } from "@hono/zod-validator";
import { RedisStore } from "@hono-rate-limiter/redis";
import { createLogger } from "@rallly/logger";
import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { handle } from "hono/vercel";
import { rateLimiter } from "hono-rate-limiter";
import { env } from "@/env";
import { redis } from "@/lib/kv";

const logger = createLogger("api/licensing");

import {
  createLicense,
  validateLicenseKey,
} from "@/features/licensing/mutations";
import type {
  CreateLicenseResponse,
  ValidateLicenseKeyResponse,
} from "@/features/licensing/schema";
import {
  createLicenseInputSchema,
  validateLicenseKeyInputSchema,
} from "@/features/licensing/schema";
import { isSelfHosted } from "@/lib/constants";

const app = new Hono().basePath("/api/licensing/v1");

app.use("*", async (c, next) => {
  if (isSelfHosted) {
    return c.json({ error: "Not available in self-hosted instances" }, 404);
  }
  return next();
});

if (env.LICENSE_API_AUTH_TOKEN) {
  app.post(
    "/licenses",
    rateLimiter({
      windowMs: 60 * 60 * 1000,
      limit: 10,
      store: redis
        ? new RedisStore({
            client: redis,
          })
        : undefined,
    }),
    zValidator("json", createLicenseInputSchema),
    bearerAuth({ token: env.LICENSE_API_AUTH_TOKEN }),
    async (c) => {
      const input = c.req.valid("json");

      try {
        const license = await createLicense(input);
        return c.json({
          data: { key: license.key },
        } satisfies CreateLicenseResponse);
      } catch (error) {
        logger.error({ error }, "Failed to create license");
        return c.json({ error: "Failed to create license" }, 500);
      }
    },
  );
}

app.post(
  "/licenses/actions/validate-key",
  rateLimiter({
    keyGenerator: async (c) => {
      const { key, fingerprint } = await c.req.json();
      return `validate-license-key:${key}:${fingerprint}`;
    },
    windowMs: 60 * 1000,
    limit: 100,
    store: redis
      ? new RedisStore({
          client: redis,
        })
      : undefined,
  }),
  zValidator("json", validateLicenseKeyInputSchema),
  async (c) => {
    const { key, fingerprint } = c.req.valid("json");

    const result = await validateLicenseKey({
      key,
      fingerprint,
      ipAddress: c.req.header("x-forwarded-for"),
      userAgent: c.req.header("user-agent"),
    });

    if (!result.valid) {
      if (result.error === "not_found") {
        return c.json({ error: "License not found" }, 404);
      }
      if (result.error === "expired") {
        return c.json({ error: "License has expired" }, 400);
      }
      return c.json({ error: "License is not active" }, 400);
    }

    return c.json({
      data: result.license,
    } satisfies ValidateLicenseKeyResponse);
  },
);

export const GET = handle(app);
export const POST = handle(app);
