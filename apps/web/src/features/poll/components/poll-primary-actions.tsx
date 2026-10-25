"use client";

import { mutationOptions } from "@next-safe-action/adapter-tanstack-query";
import { posthog } from "@rallly/posthog/client";
import { Button } from "@rallly/ui/button";
import { useDialog } from "@rallly/ui/dialog";
import { useMutation } from "@tanstack/react-query";
import {
  CalendarCheck2Icon,
  ListChecksIcon,
  Share2Icon,
  Undo2Icon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { setPollReadyToDecideAction } from "@/features/poll/actions";
import { usePoll } from "@/features/poll/client";
import { FinalizePollDialog } from "@/features/poll/components/finalize-poll-dialog";
import {
  SharePollDialog,
  useSharePollDialog,
} from "@/features/poll/components/share-dialog";
import { SHARE_POLL_FLASH_KEY } from "@/features/poll/constants";
import { Trans, useTranslation } from "@/i18n/client";
import { useFlash } from "@/lib/flash/client";

type ActionBarProps = {
  canFinalize: boolean;
  readyToDecide?: boolean;
  isUpdatingStage: boolean;
  onShare: () => void;
  onFinalize: () => void;
  onReadyToDecide: () => void;
  onBackToCollecting: () => void;
};

/**
 * While there is something to finalize, the call to action follows the
 * host's stage: Ready to decide while collecting, Finalize once ready. A new
 * poll opens the share dialog on its own, so Share stays secondary here.
 */
function DesktopActionBar({
  canFinalize,
  readyToDecide,
  isUpdatingStage,
  onShare,
  onFinalize,
  onReadyToDecide,
  onBackToCollecting,
}: ActionBarProps) {
  return (
    <>
      <Button variant={canFinalize ? "default" : "primary"} onClick={onShare}>
        <Share2Icon data-icon="inline-start" />
        <Trans i18nKey="share" defaults="Share" />
      </Button>
      {canFinalize ? (
        <>
          {readyToDecide === undefined ? null : readyToDecide ? (
            <Button loading={isUpdatingStage} onClick={onBackToCollecting}>
              <Undo2Icon data-icon="inline-start" />
              <Trans i18nKey="backToCollecting" defaults="Back to collecting" />
            </Button>
          ) : (
            <Button
              variant="primary"
              loading={isUpdatingStage}
              onClick={onReadyToDecide}
            >
              <ListChecksIcon data-icon="inline-start" />
              <Trans i18nKey="readyToDecide" defaults="Ready to decide" />
            </Button>
          )}
          <Button
            variant={readyToDecide === false ? "default" : "primary"}
            onClick={onFinalize}
          >
            <CalendarCheck2Icon data-icon="inline-start" />
            <Trans i18nKey="finalize" defaults="Finalize" />
          </Button>
        </>
      ) : null}
    </>
  );
}

function MobileActionBar({
  canFinalize,
  readyToDecide,
  isUpdatingStage,
  onShare,
  onFinalize,
  onReadyToDecide,
  onBackToCollecting,
}: ActionBarProps) {
  const { t } = useTranslation();
  return (
    <>
      <Button
        variant={canFinalize ? "default" : "primary"}
        size="icon"
        aria-label={t("share", { defaultValue: "Share" })}
        onClick={onShare}
      >
        <Share2Icon />
      </Button>
      {canFinalize ? (
        <>
          {readyToDecide === undefined ? null : readyToDecide ? (
            <Button
              size="icon"
              aria-label={t("backToCollecting", {
                defaultValue: "Back to collecting",
              })}
              loading={isUpdatingStage}
              onClick={onBackToCollecting}
            >
              <Undo2Icon />
            </Button>
          ) : (
            <Button
              variant="primary"
              size="icon"
              aria-label={t("readyToDecide", {
                defaultValue: "Ready to decide",
              })}
              loading={isUpdatingStage}
              onClick={onReadyToDecide}
            >
              <ListChecksIcon />
            </Button>
          )}
          <Button
            variant={readyToDecide === false ? "default" : "primary"}
            size="icon"
            aria-label={t("finalize", { defaultValue: "Finalize" })}
            onClick={onFinalize}
          >
            <CalendarCheck2Icon />
          </Button>
        </>
      ) : null}
    </>
  );
}

/**
 * The header's share and finalize actions. Both bars render and CSS picks
 * one, so the server markup is right for either screen size; the dialogs
 * live outside the bars so each mounts once.
 */
export function PollPrimaryActions({
  readyToDecide,
}: {
  // Only the Poll Admin pages track the stage; the legacy poll page leaves
  // it unset and keeps Finalize as its call to action.
  readyToDecide?: boolean;
}) {
  const poll = usePoll();
  const router = useRouter();
  const share = useSharePollDialog(poll.id);
  const finalizeDialog = useDialog();
  const sharePollFlash = useFlash(SHARE_POLL_FLASH_KEY);
  const canFinalize = poll.status === "open" || poll.status === "closed";
  // The action refreshes the page, which carries the new flag into the
  // layout's server props.
  const setReadyToDecide = useMutation(
    mutationOptions(setPollReadyToDecideAction, {
      onSuccess: (data, input) => {
        if (!data.ok) {
          return;
        }
        router.push(
          input.readyToDecide
            ? `/polls/${input.pollId}/results`
            : `/polls/${input.pollId}`,
        );
      },
    }),
  );

  // The create page flashes the new poll's id so the share dialog is the
  // confirmation. The flash is consumed on read, so refresh and back don't
  // reopen it. Keyed on the flash alone so a later poll id change can't
  // replay it.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs once per flash arrival
  React.useEffect(() => {
    if (sharePollFlash !== poll.id) return;
    share.open("poll_created");
  }, [sharePollFlash]);

  const actionBarProps: ActionBarProps = {
    canFinalize,
    readyToDecide,
    isUpdatingStage: setReadyToDecide.isPending,
    onShare: () => share.open("manual"),
    onFinalize: () => {
      posthog?.capture("poll_finalize:dialog_open");
      finalizeDialog.trigger();
    },
    onReadyToDecide: () => {
      posthog?.capture("poll_admin:ready_to_decide_click", {
        poll_id: poll.id,
      });
      setReadyToDecide.mutate({ pollId: poll.id, readyToDecide: true });
    },
    onBackToCollecting: () => {
      setReadyToDecide.mutate({ pollId: poll.id, readyToDecide: false });
    },
  };

  return (
    <>
      <div className="contents sm:hidden">
        <MobileActionBar {...actionBarProps} />
      </div>
      <div className="hidden sm:contents">
        <DesktopActionBar {...actionBarProps} />
      </div>
      <SharePollDialog
        {...share.dialog.dialogProps}
        pollId={poll.id}
        pollStatus={poll.status}
        inviteLink={poll.inviteLink}
      />
      <FinalizePollDialog {...finalizeDialog.dialogProps} />
    </>
  );
}
