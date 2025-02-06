import type { User } from "next-auth";
import type { OIDCConfig } from "next-auth/providers/index";

import { env } from "@/env";
import { getValueByPath } from "@/utils/get-value-by-path";

export const OIDCProvider = () => {
  if (
    process.env.OIDC_DISCOVERY_URL &&
    process.env.OIDC_CLIENT_ID &&
    process.env.OIDC_CLIENT_SECRET
  ) {
    return {
      id: "oidc",
      name: process.env.OIDC_NAME ?? "OpenID Connect",
      type: "oidc",
      wellKnown: process.env.OIDC_DISCOVERY_URL,
      authorization: { params: { scope: "openid email profile" } },
      clientId: process.env.OIDC_CLIENT_ID,
      clientSecret: process.env.OIDC_CLIENT_SECRET,
      idToken: true,
      checks: ["state"],
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        return {
          id: profile.sub,
          name: getValueByPath(profile, env.OIDC_NAME_CLAIM_PATH),
          email: getValueByPath(profile, env.OIDC_EMAIL_CLAIM_PATH),
          image: getValueByPath(profile, env.OIDC_PICTURE_CLAIM_PATH),
        } as User;
      },
    } satisfies OIDCConfig<Record<string, unknown>>;
  }
};
