declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      NODE_ENV: "development" | "production";
      JWT_SECRET: string;
      MAINTENANCE_MODE?: "true";
      PLAUSIBLE_DOMAIN?: string;
      NEXT_PUBLIC_CRISP_WEBSITE_ID?: string;
      LEGACY_MONGODB_URI?: string;
      SUPPORT_EMAIL: string;
      SMTP_HOST: string;
      SMTP_USER: string;
      SMTP_PWD: string;
      SMTP_SECURE: string;
      SMTP_PORT: string;
    }
  }
}

export {};
