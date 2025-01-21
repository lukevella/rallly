import { unstable_cache } from "next/cache";
import { getProviders } from "next-auth/react";

import { SSOProvider } from "./components/sso-provider";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getOAuthProviders() {
  const providers = await getProviders();
  if (!providers) {
    return [];
  }

  return Object.values(providers)
    .filter((provider) => provider.type === "oauth")
    .map((provider) => ({
      id: provider.id,
      name: provider.name,
    }));
}

// Cache the OAuth providers to avoid re-fetching them on every page load
const getCachedOAuthProviders = unstable_cache(
  getOAuthProviders,
  ["oauth-providers"],
  {
    revalidate: false,
  },
);

export async function SSOProviders() {
  const oAuthProviders = await getCachedOAuthProviders();
  const socialProviders = oAuthProviders.filter(
    (provider) => provider.id !== "oidc",
  );

  if (socialProviders.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4">
      {socialProviders.map((provider) => (
        <SSOProvider
          key={provider.id}
          providerId={provider.id}
          name={provider.name}
        />
      ))}
    </div>
  );
}
