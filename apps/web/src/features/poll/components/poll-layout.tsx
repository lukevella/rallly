"use client";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@rallly/ui/breadcrumb";
import { BarChart2Icon } from "lucide-react";
import { usePathname } from "next/navigation";
import type React from "react";
import { Link } from "@/components/link";
import { usePoll } from "@/features/poll/client";
import ManagePoll from "@/features/poll/components/manage-poll";
import { NotificationToggle } from "@/features/poll/components/notification-toggle";
import { LegacyPollContextProvider } from "@/features/poll/components/poll-context-provider";
import { PollPageShell } from "@/features/poll/components/poll-page-shell";
import { PollPrimaryActions } from "@/features/poll/components/poll-primary-actions";
import { RevealParticipantsToggle } from "@/features/poll/components/reveal-participants-toggle";
import { Trans } from "@/i18n/client";

const AdminControls = () => {
  return (
    <>
      <RevealParticipantsToggle />
      <NotificationToggle />
      <ManagePoll />
      <PollPrimaryActions />
    </>
  );
};

const Layout = ({ children }: React.PropsWithChildren) => {
  const poll = usePoll();
  const pollLink = `/poll/${poll.id}`;
  const pathname = usePathname();
  return (
    <PollPageShell
      header={
        <Breadcrumb className="min-w-0">
          <BreadcrumbList className="flex-nowrap">
            <BreadcrumbItem className="shrink-0">
              <BreadcrumbLink
                className="flex items-center gap-x-2"
                render={<Link href="/polls" />}
              >
                <BarChart2Icon className="size-4" />
                <Trans i18nKey="polls" defaults="Polls" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="shrink-0" />
            <BreadcrumbItem className="min-w-0">
              {pathname === pollLink ? (
                <BreadcrumbPage className="truncate">
                  {poll.title}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  className="truncate"
                  render={<Link href={pollLink} />}
                >
                  {poll.title}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      }
      actions={<AdminControls />}
    >
      {children}
    </PollPageShell>
  );
};

export const PollLayout = ({ children }: React.PropsWithChildren) => {
  return (
    <LegacyPollContextProvider>
      <Layout>{children}</Layout>
    </LegacyPollContextProvider>
  );
};
