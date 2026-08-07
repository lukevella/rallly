import "server-only";

import type { Stripe } from "@rallly/billing";
import { prisma } from "@rallly/database";
import { createLogger } from "@rallly/logger";
import { env } from "@/env";
import type {
  CreateLicenseInput,
  LicenseCheckoutMetadata,
  LicenseCheckoutProduct,
  LicenseType,
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

/**
 * TLS failures reach us as `TypeError: fetch failed` with the real reason on
 * `cause.code` — the same shape DNS and connection-refused failures take. The
 * message alone is identical in every case, so the code is the only signal
 * worth logging: a self-hosted instance behind a TLS-intercepting proxy is
 * indistinguishable from a dead DNS entry without it.
 */
const TLS_ERROR_CODE_PATTERN =
  /^(CERT_|DEPTH_ZERO_|SELF_SIGNED_|UNABLE_TO_(GET|VERIFY)_|ERR_TLS_)/;

function describeFetchFailure(error: unknown) {
  if (error instanceof DOMException && error.name === "TimeoutError") {
    return {
      reason: "timeout" as const,
      code: "TIMEOUT",
      message: `Licensing service did not respond within ${REQUEST_TIMEOUT_MS}ms.`,
    };
  }

  // Only "fetch failed" carries a transport fault. Other TypeErrors are
  // programming or configuration faults — a malformed LICENSE_API_URL throws
  // "Failed to parse URL from ..." — and reporting those as connectivity would
  // send an operator to debug a network that is working fine.
  if (error instanceof TypeError && error.message === "fetch failed") {
    const code = (error.cause as { code?: string } | undefined)?.code;

    if (code && TLS_ERROR_CODE_PATTERN.test(code)) {
      return {
        reason: "tls" as const,
        code,
        message:
          "TLS verification failed when contacting the licensing service. " +
          "If this instance is behind a proxy that intercepts HTTPS, point " +
          "NODE_EXTRA_CA_CERTS at your root CA certificate and restart.",
      };
    }

    return {
      reason: "network" as const,
      code: code ?? "UNKNOWN",
      message: "Could not reach the licensing service.",
    };
  }

  return null;
}

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
    let res: Response;
    try {
      res = await fetch(`${this.apiUrl}/licenses/actions/validate-key`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      // A thrown fetch never reaches the !res.ok branch below, so without this
      // the request failed with nothing logged at all and the operator saw a
      // bare "internal server error".
      const failure = describeFetchFailure(error);

      if (!failure) {
        throw error;
      }

      logger.error(
        { reason: failure.reason, code: failure.code, apiUrl: this.apiUrl },
        failure.message,
      );

      throw new AppError({
        code: "INTERNAL_SERVER_ERROR",
        cause: error,
        message: failure.message,
      });
    }

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

const licenseCheckoutProducts: Record<
  LicenseCheckoutProduct,
  { lookupKey: string; type: LicenseType; seats: number }
> = {
  plus: { lookupKey: "plus", type: "PLUS", seats: 5 },
  organization: {
    lookupKey: "early-organization",
    type: "ORGANIZATION",
    seats: 50,
  },
};

export async function createLicenseCheckoutSession({
  product,
  stripe,
}: {
  product: LicenseCheckoutProduct;
  stripe: Stripe;
}): Promise<{ url: string } | { error: string }> {
  const { lookupKey, type, seats } = licenseCheckoutProducts[product];

  const prices = await stripe.prices.list({
    lookup_keys: [lookupKey],
  });

  if (!prices.data || prices.data.length === 0) {
    logger.error({ product }, "No price found for lookup_key");
    return { error: "Pricing information not found for this product." };
  }

  if (prices.data.length > 1) {
    logger.warn(
      { product },
      "Multiple prices found for lookup_key, using the first one",
    );
  }

  const price = prices.data[0];

  if (!price.id) {
    logger.error({ product }, "Price object is missing an ID");
    return { error: "Price configuration error." };
  }

  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: "https://rallly.co/licensing/thank-you",
      allow_promotion_codes: true,
      billing_address_collection: "required",
      tax_id_collection: {
        enabled: true,
      },
      automatic_tax: {
        enabled: true,
      },
      invoice_creation: {
        enabled: true,
      },
      metadata: {
        licenseType: type,
        version: 4,
        seats,
      } satisfies LicenseCheckoutMetadata,
    });

    if (!session.url) {
      return { error: "Something went wrong" };
    }

    return { url: session.url };
  } catch (error) {
    logger.error({ error }, "Stripe API error");

    if (error instanceof stripe.errors.StripeError) {
      return { error: error.message };
    }

    return {
      error: "An unexpected error occurred with our payment processor.",
    };
  }
}

/**
 * Installs a validated license as the instance's license.
 *
 * An instance holds exactly one license, so this replaces whatever is
 * currently installed rather than inserting alongside it. A plain create
 * fails with a unique-constraint violation when the same key is re-entered,
 * and silently accumulates rows when a different one is — loadInstanceLicense
 * only ever reads the first by id, so the extras would be invisible but
 * authoritative.
 */
export async function setInstanceLicense(license: {
  key: string;
  licenseeName: string | null;
  licenseeEmail: string | null;
  issuedAt: Date;
  expiresAt: Date | null;
  seats: number | null;
  type: LicenseType;
  whiteLabelAddon: boolean;
}) {
  await prisma.$transaction([
    prisma.instanceLicense.deleteMany(),
    prisma.instanceLicense.create({
      data: {
        licenseKey: license.key,
        licenseeName: license.licenseeName,
        licenseeEmail: license.licenseeEmail,
        issuedAt: license.issuedAt,
        expiresAt: license.expiresAt,
        seats: license.seats,
        type: license.type,
        whiteLabelAddon: license.whiteLabelAddon,
      },
    }),
  ]);
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
