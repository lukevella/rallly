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
       * Set to "true" to take users straight to app instead of landing page
       */
      DISABLE_LANDING_PAGE?: string;
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
      /**
       * Comma separated list of email addresses that are allowed to register and login.
       * If not set, all emails are allowed. Wildcard characters are supported.
       *
       * Example: "user@example.com, *@example.com, *@*.example.com"
       */
      ALLOWED_EMAILS?: string;
      /**
       * Determines what email provider to use. "smtp" or "ses"
       */
      EMAIL_PROVIDER?: "smtp" | "ses";
      /**
       * Name of the oidc provider
       */
      OIDC_NAME?: string;
      /**
       * URL of the oidc provider .well-known/openid-configuration endpoint
       */
      OIDC_DISCOVERY_URL?: string;
      /**
       * Client ID of the oidc provider
       */
      OIDC_CLIENT_ID?: string;
      /**
       * Client secret of the oidc provider
       */
      OIDC_CLIENT_SECRET?: string;
      /**
       * Scopes that should be used when configuring the oidc provider
       */
      OIDC_SCOPES?: string;
      /**
       * If Rallly should expect the oidc provider to return an ID token
       */
      OIDC_ID_TOKEN_EXPECTED?: string;
      /**
       * When using an oidc provider that support the userinfo endpoint, set this to "true" to
       * use it instead of getting the user info from the ID token
       */
      OIDC_FORCE_USER_INFO?: string;
      /**
       * When using a provider that does not provide a userinfo endpoint in its discovery document,
       * `OIDC_FORCE_USER_INFO` may be set to the URL of the userinfo endpoint.
       * `OIDC_USER_INFO_URL` may not be usable when `OIDC_FORCE_USER_INFO` is set to `true`
       */
      OIDC_USER_INFO_URL?: string;
      /**
       * The name of the `name` field returned by the oidc provider
       */
      OIDC_NAME_CLAIM?: string;
      /**
       * The name of the `email` field returned by the oidc provider
       */
      OIDC_EMAIL_CLAIM?: string;
      /**
       * AWS access key ID
       */
      AWS_ACCESS_KEY_ID?: string;
      /**
       * AWS secret access key
       */
      AWS_SECRET_ACCESS_KEY?: string;
      /**
       * AWS region
       */
      AWS_REGION?: string;
      /**
       * The app version just for reference
       */
      NEXT_PUBLIC_APP_VERSION?: string;
    }
  }
}

export {};
