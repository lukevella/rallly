import { useQuery } from "@tanstack/react-query";
import { getProviders } from "next-auth/react";

async function getOAuthProviders() {
  const providers = await getProviders();
  if (!providers) {
    return [];
  }

  return Object.values(providers)
    .filter((provider) => {
      if (provider.type === "oauth") {
        return true;
      }
      return false;
    })
    .map((provider) => ({
      id: provider.id,
      name: provider.name,
    }));
}

export function useOAuthProviders() {
  return useQuery(["providers"], getOAuthProviders);
}
