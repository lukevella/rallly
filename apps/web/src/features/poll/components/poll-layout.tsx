"use client";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@rallly/ui/breadcrumb";
import { Button } from "@rallly/ui/button";
import { BarChart2Icon, SparklesIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import type React from "react";
import { Link } from "@/components/link";
import { usePoll } from "@/features/poll/client";
import ManagePoll from "@/features/poll/components/manage-poll";
import { NotificationToggle } from "@/features/poll/components/notification-toggle";
import { LegacyPollContextProvider } from "@/features/poll/components/poll-context-provider";
import { PollPageShell } from "@/features/poll/components/poll-page-shell";
import { PollPrimaryActions } from "@/features/poll/components/poll-primary-actions";
import { Trans } from "@/i18n/client";
import { useFeatureFlag } from "@/lib/feature-flags/client";
import { setPollAdminView } from "@/lib/poll-admin-view-client";

/**
 * Opts this browser into the new poll admin and takes the host there. Only
 * space polls have it: the new admin needs a signed in host.
 */
function TryNewViewButton() {
  const poll = usePoll();
  const router = useRouter();
  const enabled = useFeatureFlag("pollAdmin");
  if (!enabled || !poll.spaceId) return null;
  return (
    <Button
      onClick={() => {
        setPollAdminView({ view: "new", pollId: poll.id });
        router.push(`/polls/${poll.id}`);
      }}
    >
      <SparklesIcon data-icon="inline-start" />
      <Trans i18nKey="pollAdminTryNewView" defaults="Try the new view" />
    </Button>
  );
}

const AdminControls = () => {
  return (
    <>
      <TryNewViewButton />
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
