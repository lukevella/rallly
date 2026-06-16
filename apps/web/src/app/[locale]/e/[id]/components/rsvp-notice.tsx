import { BanIcon, CircleCheckIcon, ClockIcon, UsersIcon } from "lucide-react";
import { Trans } from "@/i18n/client";

function Notice({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="shrink-0 text-muted-foreground">{icon}</span>
      <p className="font-medium text-foreground text-sm">{children}</p>
    </div>
  );
}

export function RsvpNotice({
  variant,
}: {
  variant: "canceled" | "ended" | "inProgress" | "full";
}) {
  switch (variant) {
    case "canceled":
      return (
        <Notice icon={<BanIcon className="size-5" />}>
          <Trans
            i18nKey="rsvpNoticeCanceled"
            defaults="This event has been canceled"
          />
        </Notice>
      );
    case "ended":
      return (
        <Notice icon={<CircleCheckIcon className="size-5" />}>
          <Trans i18nKey="rsvpNoticeEnded" defaults="This event has ended" />
        </Notice>
      );
    case "inProgress":
      return (
        <Notice icon={<ClockIcon className="size-5" />}>
          <Trans
            i18nKey="rsvpNoticeInProgress"
            defaults="This event is in progress"
          />
        </Notice>
      );
    case "full":
      return (
        <Notice icon={<UsersIcon className="size-5" />}>
          <Trans i18nKey="rsvpNoticeFull" defaults="This event is full" />
        </Notice>
      );
  }
}
