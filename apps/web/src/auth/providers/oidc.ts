import type { User } from "next-auth";
import type { OIDCConfig } from "next-auth/providers/index";

import { env } from "@/env";
import { getValueByPath } from "@/utils/get-value-by-path";

export const OIDCProvider = () => {
  if (env.OIDC_DISCOVERY_URL && env.OIDC_CLIENT_ID && env.OIDC_CLIENT_SECRET) {
    if (!env.OIDC_ISSUER_URL) {
      console.warn(
        "OIDC_ISSUER_URL is not set. Please set it to the issuer URL of your OpenID Connect provider.",
      );
      return;
    }
    return {
      id: "oidc",
      name: env.OIDC_NAME ?? "OpenID Connect",
      type: "oidc",
      wellKnown: env.OIDC_DISCOVERY_URL,
      authorization: {
        params: {
          scope: "openid email profile",
        },
      },
      issuer: env.OIDC_ISSUER_URL,
      clientId: env.OIDC_CLIENT_ID,
      clientSecret: env.OIDC_CLIENT_SECRET,
      idToken: true,
      checks: ["pkce", "state"],
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
