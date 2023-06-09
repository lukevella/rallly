import {
  AlertCircleIcon,
  ArrowLeftIcon,
  FileBarChart,
  Share2Icon,
} from "@rallly/icons";
import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@rallly/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@rallly/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@rallly/ui/select";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";

import { Container } from "@/components/container";
import { CopyLinkButton } from "@/components/copy-link-button";
import { StandardLayout } from "@/components/layouts/standard-layout";
import {
  TopBar,
  TopBarTitle,
} from "@/components/layouts/standard-layout/top-bar";
import { useParticipants } from "@/components/participants-provider";
import ManagePoll from "@/components/poll/manage-poll";
import NotificationsToggle from "@/components/poll/notifications-toggle";
import { LegacyPollContextProvider } from "@/components/poll/participant-page/poll-context-provider";
import LegacyTooltip from "@/components/tooltip";
import { Trans } from "@/components/trans";
import { useUser } from "@/components/user-provider";
import { usePoll } from "@/contexts/poll";

import { NextPageWithLayout } from "../../types";

const InviteDialog = () => {
  const { participants } = useParticipants();
  const [isOpen, setIsOpen] = React.useState(participants.length === 0);
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild={true}>
        <Button variant="primary" icon={Share2Icon}>
          <span className="hidden sm:block">
            <Trans
              i18nKey="inviteParticipants"
              defaults="Invite Participants"
            />
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-pattern from-gray-100 via-white to-white sm:max-w-md">
        <div className="flex">
          <Share2Icon className="text-primary h-7" />
        </div>
        <DialogHeader>
          <DialogTitle>
            <Trans
              i18nKey="inviteParticipants"
              defaults="Invite Participants"
            />
          </DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="inviteParticipantsDescription"
              defaults="Copy and share the invite link to start gathering responses from your participants."
            />
          </DialogDescription>
        </DialogHeader>
        <div>
          <label className="mb-2">
            <Trans i18nKey="inviteLink" defaults="Invite Link" />
          </label>
          <CopyLinkButton />
        </div>
        <p className="text-muted-foreground text-sm">
          <Trans
            i18nKey="inviteParticipantLinkInfo"
            defaults="Anyone with this link will be able to vote on your poll."
          />
        </p>
      </DialogContent>
    </Dialog>
  );
};

const AdminControls = () => {
  const poll = usePoll();
  const hasAdminPermission = poll?.adminUrlId;
  const { user } = useUser();

  return (
    <TopBar className="">
      <div className="flex items-center justify-between sm:gap-x-4">
        <div className="flex gap-4">
          <TopBarTitle title={poll?.title} icon={FileBarChart} />
        </div>
        <div className="flex items-center gap-x-2.5">
          {user.id !== poll?.userId ? (
            <LegacyTooltip
              className="p-2 text-slate-500"
              content={
                <Trans
                  i18nKey="differentOwnerTooltip"
                  defaults="This poll was created by a different user"
                />
              }
            >
              <AlertCircleIcon className="h-5" />
            </LegacyTooltip>
          ) : null}

          <NotificationsToggle />
          {user.isGuest && poll?.userId !== user.id ? null : (
            <ManagePoll disabled={!hasAdminPermission} />
          )}
          <InviteDialog />
        </div>
      </div>
    </TopBar>
  );
};

const NavMenuItem = ({
  href,
  target,
  label,
}: {
  href: string;
  target?: string;
  label: React.ReactNode;
}) => {
  const router = useRouter();
  return (
    <Link
      target={target}
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-none px-4 py-1.5 text-sm font-medium",
        router.asPath === href
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground active:bg-gray-200/50",
      )}
    >
      {label}
    </Link>
  );
};

const SubNav = () => {
  const poll = usePoll();
  const menuItems = [
    {
      href: `/poll/${poll.id}`,
      label: <Trans i18nkey="poll" defaults="Poll" />,
    },
    {
      href: `/poll/${poll.id}/result`,
      label: <Trans i18nkey="result" defaults="Result" />,
    },
  ];
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button>hello</Button>
      </PopoverTrigger>
      <PopoverContent>
        <NavMenuItem
          href={`/poll/${poll.id}`}
          label={<Trans i18nkey="poll" defaults="Poll" />}
        />
        <NavMenuItem
          href={`/poll/${poll.id}/edit-details`}
          label={<Trans i18nkey="details" defaults="Details" />}
        />
        <NavMenuItem
          href={`/poll/${poll.id}/edit-options`}
          label={<Trans i18nkey="options" defaults="Options" />}
        />
        <NavMenuItem
          href={`/poll/${poll.id}/result`}
          label={<Trans i18nkey="results" defaults="Results" />}
        />
      </PopoverContent>
    </Popover>
  );
};

export const PollLayout = ({ children }: React.PropsWithChildren) => {
  return (
    <LegacyPollContextProvider>
      <div className="flex min-w-0 grow flex-col">
        <AdminControls />
        <div>
          <Container className="py-3 sm:py-8">{children}</Container>
        </div>
      </div>
    </LegacyPollContextProvider>
  );
};

export const getPollLayout: NextPageWithLayout["getLayout"] =
  function getLayout(page) {
    return (
      <StandardLayout>
        <PollLayout>{page}</PollLayout>
      </StandardLayout>
    );
  };
