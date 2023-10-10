import { EmailClient, SupportedEmailProviders } from "@rallly/emails";

const env = process.env["NODE" + "_ENV"];

export const emailClient = new EmailClient({
  openPreviews: env === "development",
  useTestServer: env === "test",
  provider: {
    name: (process.env.EMAIL_PROVIDER as SupportedEmailProviders) ?? "smtp",
  },
  mail: {
    from: {
      name: "Rallly",
      address:
        (process.env.NOREPLY_EMAIL as string) ||
        (process.env.SUPPORT_EMAIL as string),
    },
  },
});
