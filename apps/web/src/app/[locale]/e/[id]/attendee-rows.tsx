"use client";

import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { Trans } from "@/i18n/client";
import { SectionItem, SectionItemValue } from "./section";

type AttendeeStatus = "accepted" | "tentative" | "declined" | "pending";

export type Attendee = {
  id: string;
  name: string;
  image?: string;
  status: AttendeeStatus;
};

function StatusLabel({ status }: { status: AttendeeStatus }) {
  switch (status) {
    case "accepted":
      return <Trans i18nKey="attendeeStatusGoing" defaults="Going" />;
    case "tentative":
      return <Trans i18nKey="attendeeStatusMaybe" defaults="Maybe" />;
    case "declined":
      return <Trans i18nKey="attendeeStatusDeclined" defaults="Declined" />;
    case "pending":
      return <Trans i18nKey="attendeeStatusPending" defaults="Pending" />;
  }
}

const STATUS_ORDER: AttendeeStatus[] = ["accepted", "tentative", "declined"];

export function AttendeeRows({ attendees }: { attendees: Attendee[] }) {
  const sorted = [...attendees]
    .filter((a) => a.status !== "pending")
    .sort(
      (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status),
    );

  return (
    <>
      {sorted.map((a) => (
        <SectionItem key={a.id}>
          <OptimizedAvatarImage size="md" name={a.name} src={a.image} />
          <p className="min-w-0 truncate text-foreground text-sm">{a.name}</p>
          <SectionItemValue>
            <StatusLabel status={a.status} />
          </SectionItemValue>
        </SectionItem>
      ))}
    </>
  );
}
