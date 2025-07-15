import { zValidator } from "@hono/zod-validator";
import { RedisStore } from "@hono-rate-limiter/redis";
import { prisma } from "@rallly/database";
import { kv } from "@vercel/kv";
import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { handle } from "hono/vercel";
import { rateLimiter } from "hono-rate-limiter";
import { env } from "@/env";
import { generateLicenseKey } from "@/features/licensing/helpers/generate-license-key";
import type {
  CreateLicenseResponse,
  ValidateLicenseKeyResponse,
} from "@/features/licensing/schema";
import {
  createLicenseInputSchema,
  validateLicenseKeyInputSchema,
} from "@/features/licensing/schema";
import { isSelfHosted } from "@/utils/constants";

const isKvAvailable =
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;

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
      store: isKvAvailable
        ? new RedisStore({
            client: kv,
          })
        : undefined,
    }),
    zValidator("json", createLicenseInputSchema),
    bearerAuth({ token: env.LICENSE_API_AUTH_TOKEN }),
    async (c) => {
      const { type, seats, expiresAt, licenseeEmail, licenseeName, version } =
        c.req.valid("json");

      try {
        const license = await prisma.license.create({
          data: {
            licenseKey: generateLicenseKey({ version }),
            version,
            type,
            seats,
            issuedAt: new Date(),
            expiresAt,
            licenseeEmail,
            licenseeName,
          },
        });
        return c.json({
          data: { key: license.licenseKey },
        } satisfies CreateLicenseResponse);
      } catch (error) {
        console.error("Failed to create license:", error);
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
      return `validate-key:${key}:${fingerprint}`;
    },
    windowMs: 60 * 60 * 1000,
    limit: 10,
    store: isKvAvailable
      ? new RedisStore({
          client: kv,
        })
      : undefined,
  }),
  zValidator("json", validateLicenseKeyInputSchema),
  async (c) => {
    const { key, fingerprint } = c.req.valid("json");

    const license = await prisma.license.findUnique({
      where: {
        licenseKey: key,
      },
      select: {
        id: true,
        licenseKey: true,
        status: true,
        issuedAt: true,
        expiresAt: true,
        licenseeEmail: true,
        licenseeName: true,
        seats: true,
        type: true,
        version: true,
      },
    });

    if (!license) {
      return c.json({ error: "License not found" }, 404);
    }

    if (license.status !== "ACTIVE") {
      return c.json({ error: "License is not active" }, 400);
    }

    await prisma.licenseValidation.create({
      data: {
        licenseId: license.id,
        ipAddress: c.req.header("x-forwarded-for"),
        fingerprint,
        validatedAt: new Date(),
        userAgent: c.req.header("user-agent"),
      },
    });

    return c.json({
      data: {
        key: license.licenseKey,
        valid: license.status === "ACTIVE",
        status: license.status,
        issuedAt: license.issuedAt,
        expiresAt: license.expiresAt,
        licenseeEmail: license.licenseeEmail,
        licenseeName: license.licenseeName,
        seats: license.seats,
        type: license.type,
        version: license.version,
      },
    } satisfies ValidateLicenseKeyResponse);
  },
);

export const GET = handle(app);
export const POST = handle(app);
