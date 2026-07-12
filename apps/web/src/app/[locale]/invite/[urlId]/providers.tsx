"use client";

import { LegacyPollContextProvider } from "@/features/poll/components/poll-context-provider";
import { VisibilityProvider } from "@/features/poll/components/visibility";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LegacyPollContextProvider>
      <VisibilityProvider>{children}</VisibilityProvider>
    </LegacyPollContextProvider>
  );
}
