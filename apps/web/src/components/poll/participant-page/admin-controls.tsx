import { trpc } from "@rallly/backend";
import {
  ChartSquareBarIcon,
  ExclamationCircleIcon,
  LinkIcon,
  LoginIcon,
  SwitchHorizontalIcon,
} from "@rallly/icons";
import { Button } from "@rallly/ui/button";
import React from "react";
import { useCopyToClipboard } from "react-use";

import { useLoginModal } from "@/components/auth/login-modal";
import { LegacyButton } from "@/components/button";
import {
  TopBar,
  TopBarTitle,
} from "@/components/layouts/standard-layout/top-bar";
import ManagePoll from "@/components/poll/manage-poll";
import NotificationsToggle from "@/components/poll/notifications-toggle";
import Tooltip from "@/components/tooltip";
import { Trans } from "@/components/trans";
import { useUser } from "@/components/user-provider";
import { usePoll } from "@/contexts/poll";

const CopyLinkButton = () => {
  const poll = usePoll();

  const [state, copyToClipboard] = useCopyToClipboard();

  React.useEffect(() => {
    if (state.error) {
      console.error(`Unable to copy value: ${state.error.message}`);
    }
  }, [state]);

  const inviteLink = `${window.location.origin}/invite/${poll?.id}`;
  const [didCopy, setDidCopy] = React.useState(false);

  return (
    <Tooltip
      content={
        didCopy ? <Trans i18nKey="copied" /> : <Trans i18nKey="copyLink" />
      }
    >
      <Button
        disabled={!poll}
        icon={LinkIcon}
        onClick={() => {
          copyToClipboard(inviteLink);
          setDidCopy(true);
          setTimeout(() => {
            setDidCopy(false);
          }, 1000);
        }}
      >
        <span className="hidden sm:inline">
          <Trans i18nKey="copyInviteLink" defaults="Copy Invite Link" />
        </span>
      </Button>
    </Tooltip>
  );
};

export const AdminControls = () => {
  const poll = usePoll();
  const hasAdminPermission = poll?.adminUrlId;
  const { user } = useUser();
  const queryClient = trpc.useContext();
  const { openLoginModal } = useLoginModal();
  const transfer = trpc.polls.transfer.useMutation({
    onSuccess: () => {
      queryClient.polls.get.invalidate();
    },
  });

  return (
    <TopBar className="flex justify-between p-3">
      <TopBarTitle title={poll?.title} icon={ChartSquareBarIcon} />
      <div className="flex items-center gap-2">
        {user.id !== poll?.userId ? (
          <Tooltip
            className="p-2 text-slate-500"
            content={
              <Trans
                i18nKey="differentOwnerTooltip"
                defaults="This poll was created by a different user"
              />
            }
          >
            <ExclamationCircleIcon className="h-5" />
          </Tooltip>
        ) : null}
        {user.isGuest ? (
          <LegacyButton icon={<LoginIcon />} onClick={openLoginModal}>
            <Trans i18nKey="login" />
          </LegacyButton>
        ) : null}
        <CopyLinkButton />
        <NotificationsToggle />
        <ManagePoll placement="bottom-end" disabled={!hasAdminPermission} />
        {hasAdminPermission && user.id !== poll.userId && !poll.demo ? (
          <Tooltip
            content={
              <Trans
                i18nKey="transferTooltip"
                defaults="Transfer this poll to yourself"
              />
            }
          >
            <LegacyButton
              loading={transfer.isLoading}
              icon={<SwitchHorizontalIcon />}
              onClick={() => {
                transfer.mutate({
                  pollId: poll.id,
                });
              }}
            >
              <Trans defaults="Transfer" i18nKey="addToMyPolls" />
            </LegacyButton>
          </Tooltip>
        ) : null}
      </div>
    </TopBar>
  );
};
