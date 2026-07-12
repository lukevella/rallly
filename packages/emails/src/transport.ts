import * as aws from "@aws-sdk/client-ses";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { logger } from "@rallly/logger";
import type { Transporter } from "nodemailer";
import { createTransport } from "nodemailer";
import type { Logger as NodemailerLogger } from "nodemailer/lib/shared";

type EmailProvider = "ses" | "smtp";

// Adapts pino to nodemailer's bunyan-style logger interface. Pino exposes
// `level` as a property while nodemailer's type expects a method (it never
// calls it).
function createSmtpDebugLogger(): NodemailerLogger {
  const smtpLogger = logger.child({ name: "smtp" }, { level: "trace" });
  return {
    level: () => {},
    trace: smtpLogger.trace.bind(smtpLogger),
    debug: smtpLogger.debug.bind(smtpLogger),
    info: smtpLogger.info.bind(smtpLogger),
    warn: smtpLogger.warn.bind(smtpLogger),
    error: smtpLogger.error.bind(smtpLogger),
    fatal: smtpLogger.fatal.bind(smtpLogger),
  };
}

export type SupportedEmailProviders = EmailProvider;

let cachedTransport: Transporter | undefined;

function createTransportForProvider(provider: EmailProvider): Transporter {
  switch (provider) {
    case "ses": {
      const ses = new aws.SES({
        region: process.env["AWS" + "_REGION"] as string,
        credentialDefaultProvider: defaultProvider,
      });

      return createTransport({
        SES: { ses, aws },
        sendingRate: 10,
      });
    }
    case "smtp": {
      const hasAuth = process.env.SMTP_USER || process.env.SMTP_PWD;
      const port = process.env.SMTP_PORT
        ? Number.parseInt(process.env.SMTP_PORT, 10)
        : undefined;

      const secure = process.env.SMTP_SECURE === "true";

      // Log deprecation warning for legacy variable
      if (process.env.SMTP_TLS_ENABLED === "true") {
        console.warn(
          "⚠️  SMTP_TLS_ENABLED is deprecated and no longer affects certificate validation. Use SMTP_REJECT_UNAUTHORIZED instead.",
        );
      }

      const rejectUnauthorized =
        process.env.SMTP_REJECT_UNAUTHORIZED !== "false";

      // Logs the full SMTP conversation including the auth exchange, where
      // credentials are only base64 encoded. Never enable outside of
      // troubleshooting.
      const debug = process.env.SMTP_DEBUG === "true";

      // Warn about security change if no explicit setting
      if (
        process.env.SMTP_REJECT_UNAUTHORIZED === undefined &&
        process.env.SMTP_TLS_ENABLED === undefined
      ) {
        console.warn(
          "⚠️  Certificate validation is now enabled by default for SMTP connections. Set SMTP_REJECT_UNAUTHORIZED=true to silence this warning, or SMTP_REJECT_UNAUTHORIZED=false if using self-signed certificates.",
        );
      }

      return createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure,
        auth: hasAuth
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PWD,
            }
          : undefined,
        tls: {
          rejectUnauthorized,
          servername: process.env.SMTP_TLS_SERVERNAME,
        },
        debug,
        logger: debug ? createSmtpDebugLogger() : undefined,
      });
    }
  }
}

/**
 * Returns a process-wide memoized nodemailer transport, derived from
 * `EMAIL_PROVIDER` + the provider's env vars. Reused across every send in the
 * same (warm) process — unlike the previous per-`EmailClient`-instance cache,
 * which never outlived a single send.
 */
export function getTransport(): Transporter {
  if (!cachedTransport) {
    const provider =
      (process.env.EMAIL_PROVIDER as EmailProvider | undefined) ?? "smtp";
    cachedTransport = createTransportForProvider(provider);
  }
  return cachedTransport;
}
