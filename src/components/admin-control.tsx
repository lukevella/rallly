import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import posthog from "posthog-js";
import React from "react";
import toast from "react-hot-toast";
import { useMount } from "react-use";

import { Button } from "@/components/button";
import Share from "@/components/icons/share.svg";

import { trpc, trpcNext } from "../utils/trpc";
import Modal from "./modal/modal";
import { useParticipants } from "./participants-provider";
import ManagePoll from "./poll/manage-poll";
import { useUpdatePollMutation } from "./poll/mutations";
import NotificationsToggle from "./poll/notifications-toggle";
import { UnverifiedPollNotice } from "./poll/unverified-poll-notice";
import { usePoll } from "./poll-context";
import Sharing from "./sharing";
import { useUser } from "./user-provider";

const checkIfWideScreen = () => window.innerWidth > 640;

const useWideScreen = () => {
  const [isWideScreen, setIsWideScreen] = React.useState(checkIfWideScreen);

  React.useEffect(() => {
    const listener = () => setIsWideScreen(checkIfWideScreen());

    window.addEventListener("resize", listener);

    return () => {
      window.removeEventListener("resize", listener);
    };
  }, []);

  return isWideScreen;
};

export const AdminControls = () => {
  const { poll, urlId } = usePoll();
  const { t } = useTranslation("app");

  const isWideScreen = useWideScreen();

  const { participants } = useParticipants();

  const router = useRouter();
  const [isSharingVisible, setSharingVisible] = React.useState(
    participants.length === 0,
  );

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

  useMount(() => {
    const { code } = router.query;
    if (typeof code === "string" && !poll.verified) {
      verifyEmail.mutate({ code, pollId: poll.id });
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex sm:justify-end">
        <div className="flex gap-2">
          <NotificationsToggle />
          <ManagePoll
            placement={isWideScreen ? "bottom-end" : "bottom-start"}
          />
          <Button
            type="primary"
            icon={<Share />}
            onClick={() => {
              setSharingVisible((value) => !value);
            }}
          >
            {t("share")}
          </Button>
        </div>
      </div>
      <Modal
        visible={isSharingVisible}
        overlayClosable={true}
        onCancel={() => setSharingVisible(false)}
        showClose={true}
        footer={null}
        content={<Sharing className="p-4" />}
      />
      {poll.verified === false ? (
        <div className="overflow-hidden rounded-md border border-gray-200 bg-white p-4 text-gray-700 shadow-sm md:mx-0 md:mt-0">
          <UnverifiedPollNotice />
        </div>
      ) : null}
    </div>
  );
};
