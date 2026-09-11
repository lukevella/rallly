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
// the organizer has already linked. Guests have nothing to link.
export const loadConferencingOptions = cache(
  async ({ userId }: { userId: string | null }) => {
    const available = getAvailableConferencingProviders();
    if (available.length === 0 || !userId) {
      return null;
    }
    const connected = await getConnectedConferencingProviders(userId);
    return { available, connected };
  },
);
