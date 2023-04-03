import { ShareIcon } from "@rallly/icons";
import { AnimatePresence, m } from "framer-motion";
import { useTranslation } from "next-i18next";
import React from "react";

import { Button } from "@/components/button";

import { useParticipants } from "./participants-provider";
import ManagePoll from "./poll/manage-poll";
import NotificationsToggle from "./poll/notifications-toggle";
import Sharing from "./sharing";

export const AdminControls = (props: { children?: React.ReactNode }) => {
  const { t } = useTranslation("app");

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
            icon={<ShareIcon />}
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
