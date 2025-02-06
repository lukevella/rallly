import AzureADProvider from "next-auth/providers/azure-ad";

export function MicrosoftProvider() {
  if (
    process.env.MICROSOFT_TENANT_ID &&
    process.env.MICROSOFT_CLIENT_ID &&
    process.env.MICROSOFT_CLIENT_SECRET
  ) {
    return AzureADProvider({
      name: "Microsoft",
      tenantId: process.env.MICROSOFT_TENANT_ID,
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      wellKnown:
        "https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration",
    });
  }
  return null;
}
