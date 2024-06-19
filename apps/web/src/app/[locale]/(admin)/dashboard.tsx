"use client";
import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { PlusIcon } from "lucide-react";
import Link from "next/link";

import {
  AppCard,
  AppCardContent,
  AppCardDescription,
  AppCardFooter,
  AppCardIcon,
  AppCardName,
  GroupPollIcon,
} from "@/app/[locale]/(admin)/app-card";
import { Spinner } from "@/components/spinner";
import { Trans } from "@/components/trans";
import { trpc } from "@/utils/trpc/client";

export default function Dashboard() {
  const { data } = trpc.dashboard.info.useQuery();

  if (!data) {
    return <Spinner />;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <AppCard>
          <AppCardIcon>
            <GroupPollIcon size="lg" />
          </AppCardIcon>
          <AppCardContent>
            <div>
              <AppCardName>
                <Trans i18nKey="groupPoll" defaults="Group Poll" />
              </AppCardName>
              <AppCardDescription>
                <Trans
                  i18nKey="groupPollDescription"
                  defaults="Share your availability with a group of people and find the best time to meet."
                />
              </AppCardDescription>
            </div>
          </AppCardContent>
          <AppCardFooter className="flex items-center justify-between gap-4">
            <div className="inline-flex items-center gap-1 text-sm">
              <Link
                className="text-primary font-medium hover:underline"
                href="/polls?status=live"
              >
                <Trans
                  i18nKey="activePollCount"
                  defaults="{{activePollCount}} Live"
                  values={{
                    activePollCount: data.activePollCount,
                  }}
                />
              </Link>
            </div>
            <Button asChild>
              <Link href="/new">
                <Icon>
                  <PlusIcon />
                </Icon>
                <Trans i18nKey="create" defaults="Create" />
              </Link>
            </Button>
          </AppCardFooter>
        </AppCard>
      </div>
    </div>
  );
}
