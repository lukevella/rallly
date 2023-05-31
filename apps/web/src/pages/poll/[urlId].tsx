import { withSessionSsr } from "@rallly/backend/next";
import { decryptToken } from "@rallly/backend/session";
import { ShareIcon } from "@rallly/icons";
import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@rallly/ui/dialog";
import { GetServerSideProps } from "next";
import React from "react";

import { CopyLinkButton } from "@/components/copy-link-button";
import { getStandardLayout } from "@/components/layouts/standard-layout";
import { TopBar } from "@/components/layouts/standard-layout/top-bar";
import { useParticipants } from "@/components/participants-provider";
import ManagePoll from "@/components/poll/manage-poll";
import NotificationsToggle from "@/components/poll/notifications-toggle";
import ParticipantPage from "@/components/poll/participant-page/participant-page";
import { LegacyPollContextProvider } from "@/components/poll/participant-page/poll-context-provider";
import { usePoll } from "@/components/poll-context";
import { Trans } from "@/components/trans";
import { NextPageWithLayout } from "@/types";
import { withPageTranslations } from "@/utils/with-page-translations";

const InviteDialog = () => {
  const { poll } = usePoll();
  const { participants } = useParticipants();
  const [isOpen, setIsOpen] = React.useState(participants.length === 0);
  const inviteLink = `${window.location.origin}/invite/${poll.id}`;
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild={true}>
        <Button icon={ShareIcon}>
          <Trans i18nKey="inviteParticipants" defaults="Invite Participants" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gradient-to-b from-gray-200 via-white to-white sm:max-w-md">
        <div className="flex">
          <ShareIcon className="text-primary h-7" />
        </div>
        <DialogHeader className="mb-4">
          <DialogTitle className="">
            <Trans
              i18nKey="inviteParticipants"
              defaults="Invite Participants"
            />
          </DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="inviteParticipantsDescription"
              defaults="Copy and share the invite link below to start gathering responses from your participants."
            />
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-hidden">
          <label className="mb-2">
            <Trans i18nKey="inviteLink" defaults="Invite Link" />
          </label>
          <div className="flex items-center justify-between rounded-md border bg-gray-50 p-1.5">
            <div className="truncate px-1">{inviteLink}</div>
            <div className="shrink-0">
              <CopyLinkButton />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Page: NextPageWithLayout = () => {
  return (
    <LegacyPollContextProvider>
      <div className="flex min-w-0 grow flex-col">
        <TopBar className="flex justify-end">
          <div className="flex items-center gap-4">
            <NotificationsToggle />
            <ManagePoll />
            <InviteDialog />
          </div>
        </TopBar>
        <ParticipantPage />
      </div>
    </LegacyPollContextProvider>
  );
};

Page.getLayout = getStandardLayout;

export const getServerSideProps: GetServerSideProps = withSessionSsr(
  [
    withPageTranslations(),
    async (ctx) => {
      let userId: string | null = null;
      if (ctx.query.token) {
        const res = await decryptToken<{ userId: string }>(
          ctx.query.token as string,
        );
        if (res) {
          userId = res.userId;
        }
      }
      return {
        props: {
          forceUserId: userId,
        },
      };
    },
  ],
  {
    onPrefetch: async (ssg, ctx) => {
      const poll = await ssg.polls.get.fetch({
        urlId: ctx.params?.urlId as string,
      });

      await ssg.polls.participants.list.prefetch({
        pollId: poll.id,
      });
    },
  },
);

export default Page;
