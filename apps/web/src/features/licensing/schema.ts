import { z } from "zod";

// =========================
// Enums & Basic Types
// =========================

export const licenseTypeSchema = z.enum(["PLUS", "ORGANIZATION", "ENTERPRISE"]);
export type LicenseType = z.infer<typeof licenseTypeSchema>;

export const licenseStatusSchema = z.enum(["ACTIVE", "REVOKED"]);
export type LicenseStatus = z.infer<typeof licenseStatusSchema>;

// =========================
// Generic API Response
// =========================

export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema.optional(),
    error: z.string().optional(),
  });

export type ApiResponse<T> = {
  data?: T;
  error?: string;
};

// =========================
// Create License
// =========================

export const createLicenseInputSchema = z.object({
  type: licenseTypeSchema,
  seats: z.coerce.number().optional(),
  expiresAt: z.coerce.date().optional(),
  licenseeEmail: z.string().optional(),
  licenseeName: z.string().optional(),
  version: z.coerce.number().optional(),
  stripeCustomerId: z.string().optional(),
});
export type CreateLicenseInput = z.infer<typeof createLicenseInputSchema>;

export const createLicenseResponseSchema = apiResponseSchema(
  z.object({
    key: z.string(),
  }),
);
export type CreateLicenseResponse = z.infer<typeof createLicenseResponseSchema>;

// =========================
// Validate License Key
// =========================

export const validateLicenseKeyInputSchema = z.object({
  key: z.string(),
  fingerprint: z.string().optional(),
});
export type ValidateLicenseInputKeySchema = z.infer<
  typeof validateLicenseKeyInputSchema
>;

export const validateLicenseKeyResponseSchema = apiResponseSchema(
  z.object({
    key: z.string(),
    valid: z.boolean(),
    status: licenseStatusSchema,
    issuedAt: z.date(),
    expiresAt: z.date().nullable(),
    licenseeEmail: z.string().nullable(),
    licenseeName: z.string().nullable(),
    seats: z.number().nullable(),
    type: licenseTypeSchema,
    version: z.number().nullable(),
  }),
);

export type ValidateLicenseKeyResponse = z.infer<
  typeof validateLicenseKeyResponseSchema
>;

export const licenseCheckoutMetadataSchema = z.object({
  licenseType: licenseTypeSchema,
  version: z.coerce.number(),
  seats: z.coerce.number(),
});

export type LicenseCheckoutMetadata = z.infer<
  typeof licenseCheckoutMetadataSchema
>;
