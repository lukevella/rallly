"use client";

import { usePoll } from "@/contexts/poll";
import { getPrimaryColorVars } from "@/features/branding/color";

export function PollBrandingFromContext() {
  const poll = usePoll();
  if (!poll.space?.showBranding || !poll.space.primaryColor) {
    return null;
  }
  return <PollBranding primaryColor={poll.space.primaryColor} />;
}

export function PollBranding({ primaryColor }: { primaryColor: string }) {
  const primaryColorVars = getPrimaryColorVars(primaryColor);

  return (
    <style>{`
          .light {
            --primary: ${primaryColorVars.light};
            --primary-foreground: ${primaryColorVars.lightForeground};
          }
          .dark {
            --primary: ${primaryColorVars.dark};
            --primary-foreground: ${primaryColorVars.darkForeground};
          }
        `}</style>
  );
}
