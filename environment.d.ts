declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      NODE_ENV: "development" | "production";
      JWT_SECRET: string;
      SENDGRID_API_KEY?: string;
      MAINTENANCE_MODE?: "true";
      PLAUSIBLE_DOMAIN?: string;
      NEXT_PUBLIC_CRISP_WEBSITE_ID?: string;
      LEGACY_MONGODB_URI?: string;
    }
  }
}

export {};
