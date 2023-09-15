import { EmailClient, SupportedEmailProviders } from "@rallly/emails";

export const emailClient = new EmailClient({
  openPreviews: process.env["NODE" + "_ENV"] === "development",
  provider: {
    name: process.env.EMAIL_PROVIDER as SupportedEmailProviders,
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
