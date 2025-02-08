import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

export function MicrosoftProvider() {
  if (
    process.env.MICROSOFT_TENANT_ID &&
    process.env.MICROSOFT_CLIENT_ID &&
    process.env.MICROSOFT_CLIENT_SECRET
  ) {
    return MicrosoftEntraID({
      name: "Microsoft",
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      wellKnown:
        "https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration",
    });
  }
}
