import { AnimatePresence, motion } from "framer-motion";
import { NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { usePlausible } from "next-plausible";
import React from "react";
import toast from "react-hot-toast";
import { useMount } from "react-use";

import { Button } from "@/components/button";
import Discussion from "@/components/discussion";
import LockClosed from "@/components/icons/lock-closed.svg";
import Share from "@/components/icons/share.svg";
import DesktopPoll from "@/components/poll/desktop-poll";
import MobilePoll from "@/components/poll/mobile-poll";
import { preventWidows } from "@/utils/prevent-widows";

import { trpc } from "../utils/trpc";
import { useParticipants } from "./participants-provider";
import ManagePoll from "./poll/manage-poll";
import { useUpdatePollMutation } from "./poll/mutations";
import NotificationsToggle from "./poll/notifications-toggle";
import PollSubheader from "./poll/poll-subheader";
import TruncatedLinkify from "./poll/truncated-linkify";
import { UnverifiedPollNotice } from "./poll/unverified-poll-notice";
import { useTouchBeacon } from "./poll/use-touch-beacon";
import { UserAvatarProvider } from "./poll/user-avatar";
import VoteIcon from "./poll/vote-icon";
import { usePoll } from "./poll-context";
import Sharing from "./sharing";
import { useUser } from "./user-provider";

const PollPage: NextPage = () => {
  const { poll, urlId, admin } = usePoll();
  const { participants } = useParticipants();
  const router = useRouter();

  useTouchBeacon(poll.id);

  const { t } = useTranslation("app");

  const session = useUser();

  const queryClient = trpc.useContext();
  const plausible = usePlausible();

  const { mutate: updatePollMutation } = useUpdatePollMutation();

  const verifyEmail = trpc.useMutation(["polls.verification.verify"], {
    onSuccess: () => {
      toast.success(t("pollHasBeenVerified"));
      queryClient.setQueryData(["polls.get", { urlId, admin }], {
        ...poll,
        verified: true,
      });
      session.refresh();
      plausible("Verified email");
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

  React.useEffect(() => {
    if (router.query.unsubscribe) {
      updatePollMutation(
        { urlId: urlId, notifications: false },
        {
          onSuccess: () => {
            toast.success(t("notificationsDisabled"));
            plausible("Unsubscribed from notifications");
          },
        },
      );
      router.replace(`/admin/${router.query.urlId}`, undefined, {
        shallow: true,
      });
    }
  }, [plausible, urlId, router, updatePollMutation, t]);

  const checkIfWideScreen = () => window.innerWidth > 640;

  const [isWideScreen, setIsWideScreen] = React.useState(checkIfWideScreen);

  React.useEffect(() => {
    const listener = () => setIsWideScreen(checkIfWideScreen());

    window.addEventListener("resize", listener);

    return () => {
      window.removeEventListener("resize", listener);
    };
  }, []);

  const PollComponent = isWideScreen ? DesktopPoll : MobilePoll;

  const names = React.useMemo(
    () => participants?.map(({ name }) => name) ?? [],
    [participants],
  );

  const [isSharingVisible, setSharingVisible] = React.useState(
    !!router.query.sharing,
  );
  return (
    <UserAvatarProvider seed={poll.id} names={names}>
      <div className="relative max-w-full py-4 md:px-4">
        <Head>
          <title>{poll.title}</title>
          <meta name="robots" content="noindex,nofollow" />
        </Head>
        <div
          className="mx-auto max-w-full lg:mx-0"
          style={{
            width: Math.max(768, poll.options.length * 95 + 200 + 160),
          }}
        >
          {admin ? (
            <>
              <div className="mb-4 flex space-x-2 px-4 md:justify-end md:px-0">
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
              <AnimatePresence initial={false}>
                {isSharingVisible ? (
                  <motion.div
                    initial={{
                      opacity: 0,
                      scale: 0.8,
                      height: 0,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      height: "auto",
                      marginBottom: 16,
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.8,
                      height: 0,
                      marginBottom: 0,
                    }}
                    className="overflow-hidden"
                  >
                    <Sharing
                      onHide={() => {
                        setSharingVisible(false);
                      }}
                    />
                  </motion.div>
                ) : null}
              </AnimatePresence>
              {poll.verified === false ? (
                <div className="m-4 overflow-hidden rounded-lg border p-4 md:mx-0 md:mt-0">
                  <UnverifiedPollNotice />
                </div>
              ) : null}
            </>
          ) : null}
          {!poll.admin && poll.adminUrlId ? (
            <div className="mb-4 items-center justify-between rounded-lg px-4 md:flex md:space-x-4 md:border md:p-2 md:pl-4">
              <div className="mb-4 font-medium md:mb-0">
                {t("pollOwnerNotice", { name: poll.user.name })}
              </div>
              <a href={`/admin/${poll.adminUrlId}`} className="btn-default">
                {t("goToAdmin")} &rarr;
              </a>
            </div>
          ) : null}
          {poll.closed ? (
            <div className="flex bg-sky-100 py-3 px-4 text-sky-700 md:mb-4 md:rounded-lg md:shadow-sm">
              <div className="mr-2 rounded-md">
                <LockClosed className="w-6" />
              </div>
              <div>
                <div className="font-medium">{t("pollHasBeenLocked")}</div>
              </div>
            </div>
          ) : null}
          <div className="mb-4 border border-t bg-white md:overflow-hidden md:rounded-md">
            <div className="p-4 md:border-b md:p-6">
              <div className="space-y-4">
                <div>
                  <div
                    className="mb-1 text-2xl font-semibold text-slate-700 md:text-left md:text-3xl"
                    data-testid="poll-title"
                  >
                    {preventWidows(poll.title)}
                  </div>
                  <PollSubheader />
                </div>
                {poll.description ? (
                  <div className="border-primary whitespace-pre-line lg:text-lg">
                    <TruncatedLinkify>
                      {preventWidows(poll.description)}
                    </TruncatedLinkify>
                  </div>
                ) : null}
                {poll.location ? (
                  <div className="lg:text-lg">
                    <div className="text-sm text-slate-500">
                      {t("location")}
                    </div>
                    <TruncatedLinkify>{poll.location}</TruncatedLinkify>
                  </div>
                ) : null}
                <div>
                  <div className="mb-2 text-sm text-slate-500">
                    {t("possibleAnswers")}
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="inline-flex items-center space-x-1">
                      <VoteIcon type="yes" />
                      <span className="text-xs text-slate-500">{t("yes")}</span>
                    </span>
                    <span className="inline-flex items-center space-x-1">
                      <VoteIcon type="ifNeedBe" />
                      <span className="text-xs text-slate-500">
                        {t("ifNeedBe")}
                      </span>
                    </span>
                    <span className="inline-flex items-center space-x-1">
                      <VoteIcon type="no" />
                      <span className="text-xs text-slate-500">{t("no")}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <React.Suspense fallback={null}>
              {participants ? <PollComponent /> : null}
            </React.Suspense>
          </div>

          <React.Suspense fallback={<div className="p-4">{t("loading")}</div>}>
            <Discussion />
          </React.Suspense>
        </div>
      </div>
    </UserAvatarProvider>
  );
};

export default PollPage;
