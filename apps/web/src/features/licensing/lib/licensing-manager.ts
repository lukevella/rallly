import { createLogger } from "@rallly/logger";
import { AppError } from "@/lib/errors/app-error";
import type {
  CreateLicenseInput,
  ValidateLicenseInputKeySchema,
} from "../schema";
import {
  createLicenseResponseSchema,
  validateLicenseKeyResponseSchema,
} from "../schema";

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
