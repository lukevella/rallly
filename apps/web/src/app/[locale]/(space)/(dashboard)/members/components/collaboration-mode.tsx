"use client";

import Link from "next/link";
import { useSpace } from "@/features/space/client";
import { Trans } from "@/i18n/client";

// Passive readout of the space's collaboration mode. The control itself
// lives in the collaboration settings page; this line tells admins what an
// invitee will get before they invite, and tells members why their lists
// only show their own items.
export function CollaborationMode() {
  const { data: space } = useSpace();
  const isAdmin = space.role === "admin";

  return (
    <p className="mt-1 text-muted-foreground text-sm">
      {space.shared ? (
        <Trans
          i18nKey="membersWorkTogether"
          defaults="Members work together in this space and have full access to everything created here."
        />
      ) : (
        <Trans
          i18nKey="membersWorkIndependently"
          defaults="Members work independently in this space and only see what they create themselves."
        />
      )}
      {isAdmin ? (
        <>
          {" "}
          <Link
            className="underline hover:text-foreground"
            href="/settings/collaboration"
          >
            <Trans i18nKey="membersSharingModeChange" defaults="Change" />
          </Link>
        </>
      ) : null}
    </p>
  );
}
