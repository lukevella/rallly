"use client";
import { buttonVariants } from "@rallly/ui";
import { Icon } from "@rallly/ui/icon";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import type React from "react";

import { InviteDialog } from "@/components/invite-dialog";
import ManagePoll from "@/components/poll/manage-poll";
import { NotificationToggle } from "@/components/poll/notification-toggle";
import { LegacyPollContextProvider } from "@/components/poll/poll-context-provider";
import { usePoll } from "@/contexts/poll";
import { Trans } from "@/i18n/client";

const AdminControls = () => {
  return (
    <div className="flex items-center gap-x-2">
      <NotificationToggle />
      <ManagePoll />
      <InviteDialog />
    </div>
  );
};

const Layout = ({ children }: React.PropsWithChildren) => {
  const poll = usePoll();
  const pollLink = `/poll/${poll.id}`;
  const pathname = usePathname();
  return (
    <div className="h-dvh overflow-auto overscroll-none bg-gray-100 dark:bg-gray-900">
      <div className="sticky top-0 z-40 border-b bg-gray-100/90 p-3 backdrop-blur-lg sm:flex-row dark:bg-gray-900/90">
        <div className="mx-auto flex max-w-4xl justify-between">
          <div className="flex min-w-0 items-center gap-x-2.5">
            {pathname === pollLink ? (
              <Link
                href="/polls"
                className={buttonVariants({ variant: "ghost" })}
              >
                <Icon>
                  <ArrowLeftIcon />
                </Icon>
                <span>
                  <Trans i18nKey="back" defaults="Back" />
                </span>
              </Link>
            ) : (
              <Link
                href={pollLink}
                className={buttonVariants({ variant: "ghost" })}
              >
                <Icon>
                  <ArrowLeftIcon />
                </Icon>
                <span>
                  <Trans i18nKey="back" defaults="Back" />
                </span>
              </Link>
            )}
          </div>
          <div>
            <AdminControls />
          </div>
        </div>
      </div>
      <div className="p-3">
        <div className="mx-auto max-w-4xl space-y-3">{children}</div>
      </div>
    </div>
  );
};

export const PollLayout = ({ children }: React.PropsWithChildren) => {
  const params = useParams();

  const urlId = params?.urlId as string;

  if (!urlId) {
    // probably navigating away
    return null;
  }

  return (
    <LegacyPollContextProvider>
      <Layout>{children}</Layout>
    </LegacyPollContextProvider>
  );
};
