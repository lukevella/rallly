"use client";
import { usePostHog } from "@rallly/posthog/client";
import { useRouter } from "next/navigation";
import React from "react";
import type { UserAbility } from "@/features/user/ability";
import { defineAbilityFor } from "@/features/user/ability";
import { authClient } from "@/lib/auth-client";
import { LocaleSync } from "@/lib/locale/client";
import { trpc } from "@/trpc/client";
import { isOwner } from "@/utils/permissions";

export function useUser() {
  const [user] = trpc.user.getMe.useSuspenseQuery();
  const posthog = usePostHog();
  const router = useRouter();

  const userId = user?.id;
  const isGuest = user?.isGuest;

  React.useEffect(() => {
    if (userId && !isGuest) {
      posthog.identify(userId);
    }
  }, [userId, isGuest, posthog]);

  return React.useMemo(() => {
    return {
      user: user ?? undefined,
      createGuestIfNeeded: async () => {
        const isLegacyGuest = user?.id.startsWith("user-");
        if (!user || isLegacyGuest) {
          await authClient.signIn.anonymous();
          router.refresh();
        }
      },
      getAbility: (): UserAbility => defineAbilityFor(user ?? undefined),
      ownsObject: (resource: {
        userId?: string | null;
        guestId?: string | null;
      }) => {
        return user ? isOwner(resource, { id: user.id }) : false;
      },
    };
  }, [user, router]);
}

export function UserSync() {
  const { user } = useUser();
  return <LocaleSync userLocale={user?.locale} />;
}
