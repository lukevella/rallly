"use client";
import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import {
  ArrowLeftIcon,
  ArrowUpRight,
  LogInIcon,
  LogOutIcon,
  ShieldCloseIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import React from "react";

import { LogoutButton } from "@/app/components/logout-button";
import { InviteDialog } from "@/components/invite-dialog";
import { LoginLink } from "@/components/login-link";
import {
  PageDialog,
  PageDialogDescription,
  PageDialogFooter,
  PageDialogHeader,
  PageDialogTitle,
} from "@/components/page-dialog";
import ManagePoll from "@/components/poll/manage-poll";
import NotificationsToggle from "@/components/poll/notifications-toggle";
import { LegacyPollContextProvider } from "@/components/poll/poll-context-provider";
import { Trans } from "@/components/trans";
import { useUser } from "@/components/user-provider";
import { usePoll } from "@/contexts/poll";

const AdminControls = () => {
  return (
    <div className="flex items-center gap-x-2">
      <NotificationsToggle />
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
    <div>
      <div className="sticky top-0 z-40 border-b bg-gray-100/90 p-3 backdrop-blur-md sm:flex-row">
        <div className="mx-auto flex max-w-4xl justify-between">
          <div className="flex min-w-0 items-center gap-x-2.5">
            {pathname === pollLink ? (
              <Button variant="ghost" asChild>
                <Link href="/polls">
                  <Icon>
                    <ArrowLeftIcon />
                  </Icon>
                  <span>
                    <Trans i18nKey="back" defaults="Back" />
                  </span>
                </Link>
              </Button>
            ) : (
              <Button variant="ghost" asChild>
                <Link href={pollLink}>
                  <Icon>
                    <ArrowLeftIcon />
                  </Icon>
                  <span>
                    <Trans i18nKey="back" defaults="Back" />
                  </span>
                </Link>
              </Button>
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

const PermissionGuard = ({ children }: React.PropsWithChildren) => {
  const { user } = useUser();

  const poll = usePoll();
  if (!poll.adminUrlId) {
    return (
      <PageDialog icon={ShieldCloseIcon}>
        <PageDialogHeader>
          <PageDialogTitle>
            <Trans i18nKey="permissionDenied" defaults="Unauthorized" />
          </PageDialogTitle>
          <PageDialogDescription>
            <Trans
              i18nKey="permissionDeniedDescription"
              defaults="If you are the poll creator, please login to administor your poll."
            />
          </PageDialogDescription>
          <PageDialogDescription>
            <Trans
              i18nKey="permissionDeniedParticipant"
              defaults="If you are not the poll creator, you should go to the Invite Page."
              components={{
                a: <Link className="text-link" href={`/invite/${poll.id}`} />,
              }}
            />
          </PageDialogDescription>
        </PageDialogHeader>
        <PageDialogFooter>
          {user.isGuest ? (
            <Button asChild variant="primary">
              <LoginLink>
                <LogInIcon className="-ml-1 size-4" />
                <Trans i18nKey="login" defaults="Login" />
              </LoginLink>
            </Button>
          ) : (
            <LogoutButton>
              <LogOutIcon className="-ml-1 size-4" />
              <Trans i18nKey="loginDifferent" defaults="Switch user" />
            </LogoutButton>
          )}
          <Button asChild>
            <Link href={`/invite/${poll.id}`}>
              <Trans i18nKey="goToInvite" defaults="Go to Invite Page" />
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </PageDialogFooter>
      </PageDialog>
    );
  }

  return <>{children}</>;
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
      <PermissionGuard>
        <Layout>{children}</Layout>
      </PermissionGuard>
    </LegacyPollContextProvider>
  );
};
