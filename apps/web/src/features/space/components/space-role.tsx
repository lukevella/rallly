"use client";

import { Trans } from "@/i18n/client";
import type { MemberRole } from "@/features/space/schema";

export const SpaceRole = ({ role }: { role: MemberRole }) => {
  switch (role) {
    case "admin":
      return <Trans i18nKey="admin" defaults="Admin" />;
    case "member":
      return <Trans i18nKey="member" defaults="Member" />;
  }
};
