declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      NODE_ENV: "development" | "production";
      SECRET_PASSWORD: string;
      NEXT_PUBLIC_LEGACY_POLLS?: string;
      NEXT_PUBLIC_MAINTENANCE_MODE?: string;
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
