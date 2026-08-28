"use client";

import Link from "next/link";
import { useSpace } from "@/features/space/client";
import { Trans } from "@/i18n/client";

// Passive readout of the space's sharing mode. The control itself lives in
// general settings; this line tells admins what an invitee will see before
// they invite, and tells members why their lists only show their own items.
export function SharingMode() {
  const { data: space } = useSpace();
  const isAdmin = space.role === "admin";

  return (
    <p className="mt-1 text-muted-foreground text-sm">
      {space.shared ? (
        <Trans
          i18nKey="membersSharingModeTogether"
          defaults="Members work together in this space and see everything created here."
        />
      ) : (
        <Trans
          i18nKey="membersSharingModeIndependently"
          defaults="Members work independently in this space and only see what they create themselves."
        />
      )}
      {isAdmin ? (
        <>
          {" "}
          <Link
            className="underline hover:text-foreground"
            href="/settings/general"
          >
            <Trans i18nKey="membersSharingModeChange" defaults="Change" />
          </Link>
        </>
      ) : null}
    </p>
  );
}
