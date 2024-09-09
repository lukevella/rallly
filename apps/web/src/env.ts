import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /*
   * Serverside Environment variables, not available on the client.
   * Will throw if you access these variables on the client.
   */
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    SECRET_PASSWORD: z.string().min(32),
    /**
     * OIDC Configuration
     */
    OIDC_NAME: z.string().default("OpenID Connect"),
    OIDC_DISCOVERY_URL: z.string().optional(),
    OIDC_CLIENT_ID: z.string().optional(),
    OIDC_CLIENT_SECRET: z.string().optional(),
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
    SMTP_SECURE: z.string().optional(),
    SMTP_PORT: z.string().optional(),
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
    /**
     * Email addresses for support and no-reply emails.
     */
    SUPPORT_EMAIL: z.string().email(),
    NOREPLY_EMAIL: z.string().email().optional(),
    NOREPLY_EMAIL_NAME: z.string().default("Rallly"),

    /**
     * S3 Configuration
     */
    S3_BUCKET_NAME: z.string().optional(),
    S3_ENDPOINT: z.string().default("s3.amazonaws.com"),
    S3_ACCESS_KEY_ID: z.string().optional(),
    S3_SECRET_ACCESS_KEY: z.string().optional(),
    S3_REGION: z.string().optional(),
  },
  /*
   * Environment variables available on the client (and server).
   *
   * 💡 You'll get type errors if these are not prefixed with NEXT_PUBLIC_.
   */
  client: {
    NEXT_PUBLIC_POSTHOG_API_KEY: z.string().optional(),
    NEXT_PUBLIC_POSTHOG_API_HOST: z.string().url().optional(),
    NEXT_PUBLIC_SELF_HOSTED: z.enum(["true", "false"]).optional(),
  },
  /*
   * Due to how Next.js bundles environment variables on Edge and Client,
   * we need to manually destructure them to make sure all are included in bundle.
   *
   * 💡 You'll get type errors if not all variables from `server` & `client` are included here.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    SECRET_PASSWORD: process.env.SECRET_PASSWORD,
    OIDC_NAME: process.env.OIDC_NAME,
    OIDC_DISCOVERY_URL: process.env.OIDC_DISCOVERY_URL,
    OIDC_CLIENT_ID: process.env.OIDC_CLIENT_ID,
    OIDC_CLIENT_SECRET: process.env.OIDC_CLIENT_SECRET,
    OIDC_EMAIL_CLAIM_PATH: process.env.OIDC_EMAIL_CLAIM_PATH,
    OIDC_NAME_CLAIM_PATH: process.env.OIDC_NAME_CLAIM_PATH,
    OIDC_PICTURE_CLAIM_PATH: process.env.OIDC_PICTURE_CLAIM_PATH,
    EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PWD: process.env.SMTP_PWD,
    SMTP_SECURE: process.env.SMTP_SECURE,
    SMTP_PORT: process.env.SMTP_PORT,
    ALLOWED_EMAILS: process.env.ALLOWED_EMAILS,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: process.env.AWS_REGION,
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
    S3_ENDPOINT: process.env.S3_ENDPOINT,
    S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
    S3_REGION: process.env.S3_REGION,
    NEXT_PUBLIC_POSTHOG_API_KEY: process.env.NEXT_PUBLIC_POSTHOG_API_KEY,
    NEXT_PUBLIC_POSTHOG_API_HOST: process.env.NEXT_PUBLIC_POSTHOG_API_HOST,
    NEXT_PUBLIC_SELF_HOSTED: process.env.NEXT_PUBLIC_SELF_HOSTED,
    SUPPORT_EMAIL: process.env.SUPPORT_EMAIL,
    NOREPLY_EMAIL: process.env.NOREPLY_EMAIL,
    NOREPLY_EMAIL_NAME: process.env.NOREPLY_EMAIL_NAME,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
