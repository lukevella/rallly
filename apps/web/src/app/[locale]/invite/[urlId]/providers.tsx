"use client";

import { LegacyPollContextProvider } from "@/components/poll/poll-context-provider";
import { VisibilityProvider } from "@/components/visibility";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LegacyPollContextProvider>
      <VisibilityProvider>{children}</VisibilityProvider>
    </LegacyPollContextProvider>
  );
}
