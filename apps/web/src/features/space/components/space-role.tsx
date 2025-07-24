"use client";

import { Trans } from "@/components/trans";
import type { MemberRole } from "@/features/space/schema";

export const SpaceRole = ({ role }: { role: MemberRole }) => {
  switch (role) {
    case "admin":
      return <Trans i18nKey="admin" defaults="Admin" />;
    case "member":
      return <Trans i18nKey="member" defaults="Member" />;
  }
};
