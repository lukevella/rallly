import "server-only";

import { prisma } from "@rallly/database";
import { createLogger } from "@rallly/logger";
import { env } from "@/env";
import type {
  CreateLicenseInput,
  ValidateLicenseInputKeySchema,
} from "@/features/licensing/schema";
import {
  createLicenseResponseSchema,
  validateLicenseKeyResponseSchema,
} from "@/features/licensing/schema";
import { generateLicenseKey } from "@/features/licensing/utils";
import { AppError } from "@/lib/errors/app-error";

const logger = createLogger("licensing/manager");

const REQUEST_TIMEOUT_MS = 30_000;

export class LicenseManager {
  apiUrl: string;
  authToken?: string;

  constructor({
    apiUrl = "https://licensing.rallly.co/api/licensing/v1",
    authToken,
  }: {
    apiUrl?: string;
    authToken?: string;
  }) {
    this.apiUrl = apiUrl;
    this.authToken = authToken;
  }
  async createLicense(input: CreateLicenseInput) {
    if (!this.authToken) {
      throw new Error("Licensing API auth token is not configured.");
    }

    const res = await fetch(`${this.apiUrl}/licenses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.authToken}`,
      },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!res.ok) {
      throw new Error("Failed to create license.");
    }
    return createLicenseResponseSchema.parse(await res.json());
  }
  async validateLicenseKey(input: ValidateLicenseInputKeySchema) {
    const res = await fetch(`${this.apiUrl}/licenses/actions/validate-key`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!res.ok) {
      const text = await res.text();
      let data: unknown = text;
      try {
        data = JSON.parse(text);
      } catch {
        // Non-JSON error response (e.g. HTML from a proxy) — keep raw text
      }
      logger.error({ data }, "License validation failed");
      throw new AppError({
        code: "INTERNAL_SERVER_ERROR",
        cause: data,
        message: "Failed to validate license",
      });
    }

    return validateLicenseKeyResponseSchema.parse(await res.json());
  }
}

export const licenseManager = new LicenseManager({
  apiUrl: env.LICENSE_API_URL,
  authToken: env.LICENSE_API_AUTH_TOKEN,
});

export async function createLicense({
  type,
  seats,
  expiresAt,
  licenseeEmail,
  licenseeName,
  version,
  idempotencyKey,
}: CreateLicenseInput) {
  const data = {
    licenseKey: generateLicenseKey({ version }),
    version,
    type,
    seats,
    issuedAt: new Date(),
    expiresAt,
    licenseeEmail,
    licenseeName,
  };

  // Upsert with an empty update so concurrent requests with the same key
  // atomically resolve to the existing license instead of racing the insert
  const license = idempotencyKey
    ? await prisma.license.upsert({
        where: { idempotencyKey },
        update: {},
        create: { ...data, idempotencyKey },
      })
    : await prisma.license.create({ data });

  return { key: license.licenseKey };
}

export async function validateLicenseKey({
  key,
  fingerprint,
  ipAddress,
  userAgent,
}: {
  key: string;
  fingerprint?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
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
      whiteLabelAddon: true,
    },
  });

  if (!license) {
    return { valid: false as const, error: "not_found" as const };
  }

  if (license.status !== "ACTIVE") {
    return { valid: false as const, error: "not_active" as const };
  }

  if (license.expiresAt && license.expiresAt < new Date()) {
    return { valid: false as const, error: "expired" as const };
  }

  await prisma.licenseValidation.create({
    data: {
      licenseId: license.id,
      ipAddress,
      fingerprint,
      validatedAt: new Date(),
      userAgent,
    },
  });

  return {
    valid: true as const,
    license: {
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
      whiteLabelAddon: license.whiteLabelAddon,
    },
  };
}
