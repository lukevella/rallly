import "server-only";

import { cache } from "react";
import { loadUser } from "@/features/user/loaders";
import { getAvailableConferencingProviders } from "./constants";
import {
  getConferencingConnections,
  getConnectedConferencingProviders,
} from "./data";

export const loadConferencingConnections = cache(async () => {
  const user = await loadUser();
  return getConferencingConnections(user.id);
});

// What the poll form needs: the providers this instance offers and the ones
// the organizer has already linked. Guests have nothing to link; a pasted
// link needs no provider, so the options always exist.
export const loadConferencingOptions = cache(
  async ({ userId }: { userId: string | null }) => {
    const available = getAvailableConferencingProviders();
    const connected = userId
      ? await getConnectedConferencingProviders(userId)
      : [];
    return { available, connected };
  },
);
