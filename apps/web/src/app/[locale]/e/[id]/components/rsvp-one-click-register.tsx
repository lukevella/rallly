"use client";

import { mutationOptions } from "@next-safe-action/adapter-tanstack-query";
import { Button } from "@rallly/ui/button";
import { useMutation } from "@tanstack/react-query";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { registerForEventAction } from "@/features/scheduled-event/actions";
import { Trans } from "@/i18n/client";

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
  const register = useMutation(mutationOptions(registerForEventAction));

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
        loading={register.isPending}
        onClick={() => {
          register.mutate({ eventId });
        }}
      >
        <Trans i18nKey="rsvpOneClickRegister" defaults="One-click register" />
      </Button>
    </div>
  );
}
