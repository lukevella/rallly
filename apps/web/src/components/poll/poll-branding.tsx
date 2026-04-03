"use client";

import { getPrimaryColorVars } from "@/features/branding/color";

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
