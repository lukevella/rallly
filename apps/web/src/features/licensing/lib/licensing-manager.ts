import type {
  CreateLicenseInput,
  ValidateLicenseInputKeySchema,
} from "../schema";
import {
  createLicenseResponseSchema,
  validateLicenseKeyResponseSchema,
} from "../schema";

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
    });

    return validateLicenseKeyResponseSchema.parse(await res.json());
  }
}
