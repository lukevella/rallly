import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import posthog from "posthog-js";
import React from "react";
import toast from "react-hot-toast";
import { useMount } from "react-use";

import { Button } from "@/components/button";
import Share from "@/components/icons/share.svg";

import { trpc, trpcNext } from "../utils/trpc";
import { useParticipants } from "./participants-provider";
import ManagePoll from "./poll/manage-poll";
import { useUpdatePollMutation } from "./poll/mutations";
import NotificationsToggle from "./poll/notifications-toggle";
import { UnverifiedPollNotice } from "./poll/unverified-poll-notice";
import { usePoll } from "./poll-context";
import Sharing from "./sharing";
import { useUser } from "./user-provider";

export const AdminControls = (props: { children?: React.ReactNode }) => {
  const { poll, urlId } = usePoll();
  const { t } = useTranslation("app");

  const router = useRouter();

  const queryClient = trpcNext.useContext();

  const session = useUser();

  const { mutate: updatePollMutation } = useUpdatePollMutation();

  React.useEffect(() => {
    if (router.query.unsubscribe) {
      updatePollMutation(
        { urlId: urlId, notifications: false },
        {
          onSuccess: () => {
            toast.success(t("notificationsDisabled"));
            posthog.capture("unsubscribed from notifications");
          },
        },
      );
      router.replace(`/admin/${router.query.urlId}`, undefined, {
        shallow: true,
      });
    }
  }, [urlId, router, updatePollMutation, t]);

  const verifyEmail = trpc.useMutation(["polls.verification.verify"], {
    onSuccess: () => {
      toast.success(t("pollHasBeenVerified"));
      queryClient.poll.invalidate();
      session.refresh();
      posthog.capture("verified email");
    },
    onError: () => {
      toast.error(t("linkHasExpired"));
    },
    onSettled: () => {
      router.replace(`/admin/${router.query.urlId}`, undefined, {
        shallow: true,
      });
    },
  });

  const { participants } = useParticipants();

  const [isSharingVisible, setIsSharingVisible] = React.useState(
    participants.length === 0,
  );

  useMount(() => {
    const { code } = router.query;
    if (typeof code === "string" && !poll.verified) {
      verifyEmail.mutate({ code, pollId: poll.id });
    }
  });

  return (
    <div className="">
      <div className="mb-4 flex justify-end">
        <div className="flex gap-2">
          <NotificationsToggle />
          <ManagePoll placement="bottom-end" />
          <Button
            type="primary"
            icon={<Share />}
            onClick={() => {
              setIsSharingVisible(!isSharingVisible);
            }}
          >
            {t("share")}
          </Button>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {isSharingVisible ? (
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.8,
              marginBottom: 0,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              marginBottom: 16,
            }}
            exit={{
              opacity: 0,
              scale: 0.8,
              height: 0,
              marginBottom: 0,
            }}
            className="rounded-md border bg-white shadow-sm"
          >
            <Sharing
              className="p-4"
              onHide={() => {
                setIsSharingVisible(false);
              }}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
      <motion.div className="relative z-10 space-y-4" layout="position">
        {poll.verified === false ? <UnverifiedPollNotice /> : null}
        {props.children}
      </motion.div>
    </div>
  );
};
