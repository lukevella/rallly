import { AnimatePresence, m } from "framer-motion";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import posthog from "posthog-js";
import React from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/button";
import Share from "@/components/icons/share.svg";

import { useParticipants } from "./participants-provider";
import ManagePoll from "./poll/manage-poll";
import { useUpdatePollMutation } from "./poll/mutations";
import NotificationsToggle from "./poll/notifications-toggle";
import { usePoll } from "./poll-context";
import Sharing from "./sharing";

export const AdminControls = (props: { children?: React.ReactNode }) => {
  const { urlId } = usePoll();
  const { t } = useTranslation("app");

  const router = useRouter();

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

  const { participants } = useParticipants();

  const [isSharingVisible, setIsSharingVisible] = React.useState(
    participants.length === 0,
  );

  return (
    <div className="">
      <div className="mb-3 flex justify-end sm:mb-4">
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
          <m.div
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
            className="overflow-hidden rounded-md border bg-white shadow-sm"
          >
            <Sharing
              className="p-4"
              onHide={() => {
                setIsSharingVisible(false);
              }}
            />
          </m.div>
        ) : null}
      </AnimatePresence>
      <m.div className="relative z-10 space-y-4" layout="position">
        {props.children}
      </m.div>
    </div>
  );
};
