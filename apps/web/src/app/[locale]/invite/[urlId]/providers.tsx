"use client";

import { VisibilityProvider } from "@/components/visibility";
import { LegacyPollContextProvider } from "@/features/poll/components/poll-context-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LegacyPollContextProvider>
      <VisibilityProvider>{children}</VisibilityProvider>
    </LegacyPollContextProvider>
  );
}
