"use client";

import { Button } from "@rallly/ui/button";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { registerForEventAction } from "@/features/scheduled-event/actions";
import { Trans } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";

export function RsvpOneClickRegister({
  eventId,
  name,
  email,
  image,
}: {
  eventId: string;
  name: string;
  email: string;
  image?: string;
}) {
  const register = useSafeAction(registerForEventAction);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <OptimizedAvatarImage src={image} name={name} size="md" />
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground text-sm">{name}</p>
          <p className="truncate text-muted-foreground text-sm">{email}</p>
        </div>
      </div>
      <Button
        size="lg"
        variant="primary"
        loading={register.isExecuting}
        onClick={async () => {
          await register.executeAsync({ eventId });
        }}
      >
        <Trans i18nKey="rsvpOneClickRegister" defaults="One-click register" />
      </Button>
    </div>
  );
}
