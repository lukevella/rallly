"use client";

import { Trans } from "@/components/trans";
import type { SpaceMemberRole } from "@/features/spaces/schema";

export const SpaceRole = ({ role }: { role: SpaceMemberRole }) => {
  switch (role) {
    case "owner":
      return <Trans i18nKey="owner" defaults="Owner" />;
    case "admin":
      return <Trans i18nKey="admin" defaults="Admin" />;
    case "member":
      return <Trans i18nKey="member" defaults="Member" />;
  }
};
