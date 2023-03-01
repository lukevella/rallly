declare global {
  namespace NodeJS {
    interface ProcessEnv {
      /**
       * Full database connection string
       */
      DATABASE_URL: string;
      /**
       *  "development" or "production"
       */
      NODE_ENV: "development" | "production";
      /**
       * Can be "false" or a relative path eg. "/new"
       */
      LANDING_PAGE: string;
      /**
       * Must be 32 characters long
       */
      SECRET_PASSWORD: string;
      /**
       * "1" to turn on maintenance mode
       */
      NEXT_PUBLIC_MAINTENANCE_MODE?: string;
      /**
       * Posthog API key
       */
      NEXT_PUBLIC_POSTHOG_API_KEY?: string;
      /**
       * Posthog API host
       */
      NEXT_PUBLIC_POSTHOG_API_HOST?: string;
      /**
       * Crisp website ID
       */
      NEXT_PUBLIC_CRISP_WEBSITE_ID?: string;
      /**
       * Users of your instance will see this as their support email
       */
      SUPPORT_EMAIL: string;
      /**
       * Host address of the SMTP server
       */
      SMTP_HOST: string;
      /**
       * Email address or user if authentication is required
       */
      SMTP_USER: string;
      /**
       * Password if authentication is required
       */
      SMTP_PWD: string;
      /**
       * "true" to use SSL
       */
      SMTP_SECURE: string;
      /**
       * Port number of the SMTP server
       */
      SMTP_PORT: string;
    }
  }
}

export {};
