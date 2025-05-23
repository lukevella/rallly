import {
  type CreateLicenseInput,
  type ValidateLicenseInputKeySchema,
  createLicenseResponseSchema,
  validateLicenseKeyResponseSchema,
} from "../schema";

export class LicensingClient {
  apiUrl: string;
  authToken?: string;

  constructor({
    apiUrl = "https://licensing.rallly.co",
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

    const res = await fetch(`${this.apiUrl}/api/v1/licenses`, {
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
    const res = await fetch(
      `${this.apiUrl}/api/v1/licenses/actions/validate-key`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      },
    );

    if (!res.ok) {
      throw new Error("Failed to validate license key.");
    }

    return validateLicenseKeyResponseSchema.parse(await res.json());
  }
}
