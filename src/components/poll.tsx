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
import Key from "@/components/icons/key.svg";
import LockClosed from "@/components/icons/lock-closed.svg";
import Share from "@/components/icons/share.svg";
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
import { useSession } from "./session";
import Sharing from "./sharing";
import StandardLayout from "./standard-layout";

const Discussion = React.lazy(() => import("@/components/discussion"));

const DesktopPoll = React.lazy(() => import("@/components/poll/desktop-poll"));
const MobilePoll = React.lazy(() => import("@/components/poll/mobile-poll"));

const PollPage: NextPage = () => {
  const { poll } = usePoll();
  const { participants } = useParticipants();
  const router = useRouter();

  useTouchBeacon(poll.pollId);

  useMount(() => {
    const path = poll.role === "admin" ? "admin" : "p";

    if (!new RegExp(`^/${path}`).test(router.asPath)) {
      router.replace(`/${path}/${poll.urlId}`, undefined, { shallow: true });
    }
  });

  const { t } = useTranslation("app");

  const session = useSession();

  const queryClient = trpc.useContext();
  const plausible = usePlausible();

  const { mutate: updatePollMutation } = useUpdatePollMutation();

  const verifyEmail = trpc.useMutation(["polls.verification.verify"], {
    onSuccess: () => {
      toast.success("Your poll has been verified");
      queryClient.setQueryData(["polls.get", { urlId: poll.urlId }], {
        ...poll,
        verified: true,
      });
      session.refresh();
      plausible("Verified email");
    },
    onError: () => {
      toast.error("Your link has expired or is no longer valid");
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
      verifyEmail.mutate({ code, pollId: poll.pollId });
    }
  });

  React.useEffect(() => {
    if (router.query.unsubscribe) {
      updatePollMutation(
        { urlId: poll.urlId, notifications: false },
        {
          onSuccess: () => {
            toast.success("Notifications have been disabled");
            plausible("Unsubscribed from notifications");
          },
        },
      );
      router.replace(`/admin/${router.query.urlId}`, undefined, {
        shallow: true,
      });
    }
  }, [plausible, poll.urlId, router, updatePollMutation]);

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
    <UserAvatarProvider seed={poll.pollId} names={names}>
      <StandardLayout>
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
            {poll.role === "admin" ? (
              <>
                <div className="-mt-4 flex flex-col rounded-lg p-4 md:mt-0 md:mb-4 md:flex-row md:items-center md:justify-between md:border md:p-2">
                  <div className="flex space-x-2">
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
                      Share
                    </Button>
                  </div>
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
                          router.replace(
                            `/admin/${router.query.urlId}`,
                            undefined,
                            {
                              shallow: true,
                            },
                          );
                        }}
                      />
                    </motion.div>
                  ) : null}
                </AnimatePresence>
                {poll.verified === false ? (
                  <div className="mb-4 overflow-hidden border-y p-4 md:rounded-lg md:border-x">
                    <UnverifiedPollNotice />
                  </div>
                ) : null}
              </>
            ) : null}
            <div className="md:card space-y-4 border-t bg-white p-4 md:mb-4">
              <div>
                <div className="space-y-4">
                  <div>
                    <div className="mb-1 text-2xl font-semibold text-slate-700 md:text-left md:text-3xl">
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
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-semibold text-slate-500">
                      Key:
                    </span>
                    <span className="inline-flex items-center space-x-1">
                      <VoteIcon type="yes" />
                      <span className="text-xs text-slate-500">Yes</span>
                    </span>
                    <span className="inline-flex items-center space-x-1">
                      <VoteIcon type="ifNeedBe" />
                      <span className="text-xs text-slate-500">If need be</span>
                    </span>
                    <span className="inline-flex items-center space-x-1">
                      <VoteIcon type="no" />
                      <span className="text-xs text-slate-500">No</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {poll.closed ? (
              <div className="flex items-center bg-sky-100 py-3 px-4 text-sky-700 shadow-sm md:mb-4 md:rounded-lg">
                <div className="mr-3 rounded-md">
                  <LockClosed className="w-5" />
                </div>
                This poll has been locked (voting is disabled)
              </div>
            ) : null}

            <React.Suspense fallback={<div className="p-4">Loading…</div>}>
              {participants ? (
                <div className="mb-4">
                  <PollComponent />
                </div>
              ) : null}
              <Discussion />
            </React.Suspense>
          </div>
        </div>
      </StandardLayout>
    </UserAvatarProvider>
  );
};

export default PollPage;
