import { CircleCheckIcon } from "lucide-react";
import { Trans } from "@/i18n/client";

export function RsvpRegistered({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <CircleCheckIcon className="size-9 shrink-0 text-green-600" />
      <div>
        <p className="font-medium text-foreground text-sm">
          <Trans i18nKey="rsvpStatusRegistered" defaults="You're going!" />
        </p>
        <p className="text-muted-foreground text-sm">
          {name} · {email}
        </p>
      </div>
    </div>
  );
}
