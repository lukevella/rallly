import { createEnv } from "@t3-oss/env-nextjs";
import { env as runtimeEnv } from "next-runtime-env";
import { z } from "zod";

const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL;

export const env = createEnv({
  /*
   * Serverside Environment variables, not available on the client.
   * Will throw if you access these variables on the client.
   */
  server: {
    DATABASE_URL: z.url(),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    SECRET_PASSWORD: z.string().min(32),
    API_SECRET: z.string().min(32).optional(),
    /**
     * OIDC Configuration
     */
    OIDC_NAME: z.string().default("OpenID Connect"),
    OIDC_DISCOVERY_URL: z.string().optional(),
    OIDC_CLIENT_ID: z.string().optional(),
    OIDC_CLIENT_SECRET: z.string().optional(),
    OIDC_ISSUER_URL: z.string().optional(),
    OIDC_EMAIL_CLAIM_PATH: z.string().default("email"),
    OIDC_NAME_CLAIM_PATH: z.string().default("name"),
    OIDC_PICTURE_CLAIM_PATH: z.string().default("picture"),
    /**
     * Email Provider
     * Choose which service provider to use for sending emails.
     * Make sure to configure the corresponding environment variables.
     */
    EMAIL_PROVIDER: z.enum(["smtp", "ses"]).default("smtp"),
    /**
     * SMTP Configuration
     */
    SMTP_HOST: z.string().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PWD: z.string().optional(),
    SMTP_SECURE: z.enum(["true", "false"]).optional(),
    SMTP_PORT: z.string().optional(),
    SMTP_REJECT_UNAUTHORIZED: z.enum(["true", "false"]).optional(),
    /** @deprecated Use SMTP_REJECT_UNAUTHORIZED instead */
    SMTP_TLS_ENABLED: z.enum(["true", "false"]).optional(),
    /**
     * AWS SES Configuration
     */
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    AWS_REGION: z.string().optional(),
    /**
     * Comma separated list of email addresses that are allowed to register and login.
     * If not set, all emails are allowed. Wildcard characters are supported.
     *
     * Example: "user@example.com, *@example.com, *@*.example.com"
     */
    ALLOWED_EMAILS: z.string().optional(),
    EMAIL_LOGIN_ENABLED: z.enum(["true", "false"]).default("true"),
    REGISTRATION_ENABLED: z.enum(["true", "false"]).default("true"),
    /**
     * Email addresses for support and no-reply emails.
     */
    SUPPORT_EMAIL: z.email(),
    NOREPLY_EMAIL: z.email().optional(),
    NOREPLY_EMAIL_NAME: z.string().default("Rallly"),

    /**
     * S3 Configuration
     */
    S3_BUCKET_NAME: z.string().optional(),
    S3_ENDPOINT: z.string().optional(),
    S3_ACCESS_KEY_ID: z.string().optional(),
    S3_SECRET_ACCESS_KEY: z.string().optional(),
    S3_REGION: z.string().optional(),

    /**
     * OpenAI Configuration for AI moderation
     */
    OPENAI_API_KEY: z.string().optional(),
    /**
     * Enable or disable content moderation
     * @default "false"
     */
    MODERATION_ENABLED: z.enum(["true", "false"]).default("false"),
    /**
     * Licensing API Configuration
     */
    LICENSE_API_URL: z.string().optional(),
    LICENSE_API_AUTH_TOKEN: z.string().optional(),

    /**
     * Google Integration
     */
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),

    /**
     * Microsoft Integration
     */
    MICROSOFT_TENANT_ID: z.string().optional().default("common"),
    MICROSOFT_CLIENT_ID: z.string().optional(),
    MICROSOFT_CLIENT_SECRET: z.string().optional(),

    /**
     * Primary color for theming (hex format, e.g., "#4f46e5")
     */
    PRIMARY_COLOR: z.string().optional(),
  },
  /*
   * Environment variables available on the client (and server).
   *
   * You'll get type errors if these are not prefixed with NEXT_PUBLIC_.
   */
  client: {
    NEXT_PUBLIC_BASE_URL: z.url(),
    NEXT_PUBLIC_POSTHOG_API_KEY: z.string().optional(),
    NEXT_PUBLIC_POSTHOG_API_HOST: z.url().optional(),
    NEXT_PUBLIC_SELF_HOSTED: z.enum(["true", "false"]).optional(),
  },
  /*
   * Due to how Next.js bundles environment variables on Edge and Client,
   * we need to manually destructure them to make sure all are included in bundle.
   *
   * You'll get type errors if not all variables from `server` & `client` are included here.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    SECRET_PASSWORD: process.env.SECRET_PASSWORD,
    API_SECRET: process.env.API_SECRET,
    OIDC_NAME: process.env.OIDC_NAME,
    OIDC_DISCOVERY_URL: process.env.OIDC_DISCOVERY_URL,
    OIDC_CLIENT_ID: process.env.OIDC_CLIENT_ID,
    OIDC_CLIENT_SECRET: process.env.OIDC_CLIENT_SECRET,
    OIDC_ISSUER_URL: process.env.OIDC_ISSUER_URL,
    OIDC_EMAIL_CLAIM_PATH: process.env.OIDC_EMAIL_CLAIM_PATH,
    OIDC_NAME_CLAIM_PATH: process.env.OIDC_NAME_CLAIM_PATH,
    OIDC_PICTURE_CLAIM_PATH: process.env.OIDC_PICTURE_CLAIM_PATH,
    EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PWD: process.env.SMTP_PWD,
    SMTP_SECURE: process.env.SMTP_SECURE,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_REJECT_UNAUTHORIZED: process.env.SMTP_REJECT_UNAUTHORIZED,
    SMTP_TLS_ENABLED: process.env.SMTP_TLS_ENABLED,
    ALLOWED_EMAILS: process.env.ALLOWED_EMAILS,
    EMAIL_LOGIN_ENABLED: process.env.EMAIL_LOGIN_ENABLED,
    REGISTRATION_ENABLED: process.env.REGISTRATION_ENABLED,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: process.env.AWS_REGION,
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
    S3_ENDPOINT: process.env.S3_ENDPOINT,
    S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
    S3_REGION: process.env.S3_REGION,
    NEXT_PUBLIC_BASE_URL:
      runtimeEnv("NEXT_PUBLIC_BASE_URL") ??
      (vercelUrl ? `https://${vercelUrl}` : undefined),
    NEXT_PUBLIC_POSTHOG_API_KEY: runtimeEnv("NEXT_PUBLIC_POSTHOG_API_KEY"),
    NEXT_PUBLIC_POSTHOG_API_HOST: runtimeEnv("NEXT_PUBLIC_POSTHOG_API_HOST"),
    NEXT_PUBLIC_SELF_HOSTED: runtimeEnv("NEXT_PUBLIC_SELF_HOSTED"),
    SUPPORT_EMAIL: process.env.SUPPORT_EMAIL,
    NOREPLY_EMAIL: process.env.NOREPLY_EMAIL,
    NOREPLY_EMAIL_NAME: process.env.NOREPLY_EMAIL_NAME,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    MODERATION_ENABLED: process.env.MODERATION_ENABLED,
    LICENSE_API_URL: process.env.LICENSE_API_URL,
    LICENSE_API_AUTH_TOKEN: process.env.LICENSE_API_AUTH_TOKEN,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    MICROSOFT_TENANT_ID: process.env.MICROSOFT_TENANT_ID,
    MICROSOFT_CLIENT_ID: process.env.MICROSOFT_CLIENT_ID,
    MICROSOFT_CLIENT_SECRET: process.env.MICROSOFT_CLIENT_SECRET,
    PRIMARY_COLOR: process.env.PRIMARY_COLOR,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
