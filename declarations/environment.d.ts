declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      NODE_ENV: "development" | "production";
      SECRET_PASSWORD: string;
      NEXT_PUBLIC_MAINTENANCE_MODE?: string;
      PLAUSIBLE_DOMAIN?: string;
      NEXT_PUBLIC_CRISP_WEBSITE_ID?: string;
      SUPPORT_EMAIL: string;
      SMTP_HOST: string;
      SMTP_USER: string;
      SMTP_PWD: string;
      SMTP_SECURE: string;
      SMTP_PORT: string;
      TRUSTPILOT_EMAIL: string;
    }
  }
}

export {};
