import "server-only";

import { cache } from "react";
import { loadUser } from "@/features/user/loaders";
import { getAvailableConferencingProvidersFor } from "./constants";
import {
  getConferencingConnections,
  getConnectedConferencingProviders,
} from "./data";

export const loadAvailableConferencingProviders = cache(async () => {
  const user = await loadUser();
  return getAvailableConferencingProvidersFor({ email: user.email });
});

export const loadConferencingConnections = cache(async () => {
  const user = await loadUser();
  return getConferencingConnections(user.id);
});

// What the poll form needs: the providers this instance offers and the ones
// the organizer has already linked. Guests have nothing to link; a pasted
// link needs no provider, so the options always exist.
export const loadConferencingOptions = cache(
  async ({
    userId,
    email,
  }: {
    userId: string | null;
    email: string | null;
  }) => {
    const available = getAvailableConferencingProvidersFor({ email });
    // A provider the user linked before it was gated is not offered either.
    const connected = userId
      ? (await getConnectedConferencingProviders(userId)).filter((provider) =>
          available.includes(provider),
        )
      : [];
    return { available, connected };
  },
);
