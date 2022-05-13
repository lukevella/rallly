import axios from "axios";
import { NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { usePlausible } from "next-plausible";
import React from "react";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "react-query";
import { useMount } from "react-use";
import { preventWidows } from "utils/prevent-widows";

import Button from "@/components/button";
import LocationMarker from "@/components/icons/location-marker.svg";
import LockClosed from "@/components/icons/lock-closed.svg";
import Share from "@/components/icons/share.svg";

import ManagePoll from "./poll/manage-poll";
import { useUpdatePollMutation } from "./poll/mutations";
import NotificationsToggle from "./poll/notifications-toggle";
import PollSubheader from "./poll/poll-subheader";
import TruncatedLinkify from "./poll/truncated-linkify";
import { UserAvatarProvider } from "./poll/user-avatar";
import VoteIcon from "./poll/vote-icon";
import { usePoll } from "./poll-context";
import Popover from "./popover";
import { useSession } from "./session";
import Sharing from "./sharing";
import StandardLayout from "./standard-layout";

const Discussion = React.lazy(() => import("@/components/discussion"));

const DesktopPoll = React.lazy(() => import("@/components/poll/desktop-poll"));
const MobilePoll = React.lazy(() => import("@/components/poll/mobile-poll"));

const PollPage: NextPage = () => {
  const { poll } = usePoll();

  const router = useRouter();

  useMount(() => {
    const path = poll.role === "admin" ? "admin" : "p";

    if (!new RegExp(`^/${path}`).test(router.asPath)) {
      router.replace(`/${path}/${poll.urlId}`, undefined, { shallow: true });
    }
  });

  const session = useSession();

  const queryClient = useQueryClient();
  const plausible = usePlausible();

  const { mutate: updatePollMutation } = useUpdatePollMutation();

  const { mutate: verifyEmail } = useMutation(
    async (verificationCode: string) => {
      await axios.post(`/api/poll/${poll.urlId}/verify`, {
        verificationCode,
      });
    },
    {
      onSuccess: () => {
        toast.success("Your poll has been verified");
        queryClient.setQueryData(["getPoll", poll.urlId], {
          ...poll,
          verified: true,
        });
        session.refresh();
        plausible("Verified email");
      },
      onSettled: () => {
        router.replace(`/admin/${router.query.urlId}`, undefined, {
          shallow: true,
        });
      },
      onError: () => {
        toast.error("Your link has expired or is no longer valid");
      },
    },
  );

  React.useEffect(() => {
    // TODO (Luke Vella) [2022-03-29]: stop looking for "verificationCode". We switched to
    // "code" for compatability with v1 and it's generally better since it's more concise
    const verificationCode = router.query.verificationCode ?? router.query.code;
    if (typeof verificationCode === "string") {
      verifyEmail(verificationCode);
    }
  }, [router, verifyEmail]);

  React.useEffect(() => {
    if (router.query.unsubscribe) {
      updatePollMutation(
        { notifications: false },
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
  }, [plausible, router, updatePollMutation]);

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
    () => poll.participants.map(({ name }) => name),
    [poll.participants],
  );

  return (
    <UserAvatarProvider seed={poll.pollId} names={names}>
      <StandardLayout>
        <div className="relative max-w-full bg-gray-50 py-4 md:px-4 lg:px-4">
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
            <div className="mb-6">
              <div className="mb-3 items-start px-4 md:flex md:space-x-4">
                <div className="mb-3 grow md:mb-0">
                  <div className="flex flex-col-reverse md:flex-row">
                    <h1
                      data-testid="poll-title"
                      className="mb-2 grow text-3xl leading-tight"
                    >
                      {preventWidows(poll.title)}
                    </h1>
                    {poll.role === "admin" ? (
                      <div className="mb-4 flex space-x-2 md:mb-2">
                        <NotificationsToggle />
                        <ManagePoll
                          placement={
                            isWideScreen ? "bottom-end" : "bottom-start"
                          }
                        />
                        <div>
                          <Popover
                            trigger={
                              <Button type="primary" icon={<Share />}>
                                Share
                              </Button>
                            }
                            placement={isWideScreen ? "bottom-end" : undefined}
                          >
                            <Sharing links={poll.links} />
                          </Popover>
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <PollSubheader />
                </div>
              </div>
              {poll.description ? (
                <div className="mb-4 whitespace-pre-line bg-white px-4 py-3 text-lg leading-relaxed text-slate-600 shadow-sm md:w-fit md:rounded-xl md:bg-white">
                  <TruncatedLinkify>
                    {preventWidows(poll.description)}
                  </TruncatedLinkify>
                </div>
              ) : null}
              {poll.location ? (
                <div className="mb-4 flex items-center px-4">
                  <div>
                    <LocationMarker
                      width={20}
                      className="mr-2 text-slate-400"
                    />
                  </div>
                  <TruncatedLinkify>{poll.location}</TruncatedLinkify>
                </div>
              ) : null}
            </div>
            {poll.closed ? (
              <div className="mb-4 flex items-center bg-sky-100 py-3 px-4 text-sky-700 shadow-sm md:rounded-lg">
                <div className="mr-3 rounded-md">
                  <LockClosed className="w-5" />
                </div>
                This poll has been locked (voting is disabled)
              </div>
            ) : null}

            <div className="flex items-center space-x-3 px-4 py-2 sm:justify-end">
              <span className="text-xs font-semibold text-slate-500">
                Legend:
              </span>
              <span className="inline-flex items-center space-x-2">
                <VoteIcon type="yes" />
                <span className="text-xs text-slate-500">Yes</span>
              </span>
              <span className="inline-flex items-center space-x-2">
                <VoteIcon type="ifNeedBe" />
                <span className="text-xs text-slate-500">If need be</span>
              </span>

              <span className="inline-flex items-center space-x-2">
                <VoteIcon type="no" />
                <span className="text-xs text-slate-500">No</span>
              </span>
            </div>
            <React.Suspense fallback={<div>Loading…</div>}>
              <div className="mb-4 lg:mb-8">
                <PollComponent pollId={poll.urlId} />
              </div>
              <Discussion pollId={poll.urlId} />
            </React.Suspense>
          </div>
        </div>
      </StandardLayout>
    </UserAvatarProvider>
  );
};

export default PollPage;
