import axios from "axios";
import { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { usePlausible } from "next-plausible";
import React from "react";
import { toast } from "react-hot-toast";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useMount } from "react-use";
import { preventWidows } from "utils/prevent-widows";

import Button from "@/components/button";
import ErrorPage from "@/components/error-page";
import FullPageLoader from "@/components/full-page-loader";
import LocationMarker from "@/components/icons/location-marker.svg";
import LockClosed from "@/components/icons/lock-closed.svg";
import Share from "@/components/icons/share.svg";
import ManagePoll from "@/components/poll/manage-poll";
import MobilePoll from "@/components/poll/mobile-poll";
import { useUpdatePollMutation } from "@/components/poll/mutations";
import NotificationsToggle from "@/components/poll/notifications-toggle";
import PollSubheader from "@/components/poll/poll-subheader";
import TruncatedLinkify from "@/components/poll/truncated-linkify";
import { UserAvatarProvider } from "@/components/poll/user-avatar";
import { PollContextProvider, usePoll } from "@/components/poll-context";
import Popover from "@/components/popover";
import Sharing from "@/components/sharing";
import StandardLayout from "@/components/standard-layout";
import { useUserName } from "@/components/user-name-context";

import { GetPollResponse } from "../api-client/get-poll";
import Custom404 from "./404";

const Discussion = React.lazy(() => import("@/components/discussion"));

const Poll = React.lazy(() => import("@/components/poll"));

const PollPageLoader: NextPage = () => {
  const { query } = useRouter();
  const { t } = useTranslation("app");
  const urlId = query.urlId as string;

  const [didError, setDidError] = React.useState(false);
  const [didFailToConvertLegacyPoll, setDidFailToConvertLegacyPoll] =
    React.useState(false);

  const plausible = usePlausible();

  const { data: poll } = useQuery<GetPollResponse | null>(
    ["getPoll", urlId],
    async () => {
      try {
        const { data } = await axios.get<GetPollResponse>(`/api/poll/${urlId}`);
        return data;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          try {
            // check if poll exists from the legacy endpoint and convert it if it does
            const { data } = await axios.get<GetPollResponse>(
              `/api/legacy/${urlId}`,
            );
            plausible("Converted legacy event");
            return data;
          } catch (err) {
            if (axios.isAxiosError(err) && err.response?.status === 500) {
              // failed to convert legacy poll
              setDidFailToConvertLegacyPoll(true);
            }
            throw err;
          }
        } else {
          throw error;
        }
      }
    },
    {
      onError: () => {
        setDidError(true);
      },
      retry: false,
    },
  );

  if (didFailToConvertLegacyPoll) {
    return (
      <ErrorPage
        title="Server error"
        description="There was a problem retrieving your poll. Please contact support."
      />
    );
  }

  if (didError) {
    return <Custom404 />;
  }

  return !poll ? (
    <FullPageLoader>{t("loading")}</FullPageLoader>
  ) : (
    <PollContextProvider value={poll}>
      <PollPage />
    </PollContextProvider>
  );
};

const PollPage: NextPage = () => {
  const { poll } = usePoll();

  const router = useRouter();

  useMount(() => {
    const path = poll.role === "admin" ? "admin" : "p";

    if (!new RegExp(`^/${path}`).test(router.asPath)) {
      router.replace(`/${path}/${poll.urlId}`, undefined, { shallow: true });
    }
  });

  const [, setUserName] = useUserName();

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
        router.replace(`/admin/${router.query.urlId}`, undefined, {
          shallow: true,
        });
        queryClient.setQueryData(["getPoll", poll.urlId], {
          ...poll,
          verified: true,
        });
        plausible("Verified email");
        setUserName(poll.authorName);
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

  const PollComponent = isWideScreen ? Poll : MobilePoll;

  let highScore = 1; // set to one because we don't want to highlight
  poll.options.forEach((option) => {
    if (option.votes.length > highScore) {
      highScore = option.votes.length;
    }
  });

  const names = React.useMemo(
    () => poll.participants.map(({ name }) => name),
    [poll.participants],
  );

  return (
    <UserAvatarProvider seed={poll.pollId} names={names}>
      <StandardLayout>
        <div className="relative max-w-full bg-gray-50 py-4 md:px-4 lg:w-[1024px] lg:px-8">
          <Head>
            <title>{poll.title}</title>
            <meta name="robots" content="noindex,nofollow" />
          </Head>
          <div
            className="max-w-full"
            style={{
              width: Math.max(600, poll.options.length * 95 + 200 + 160),
            }}
          >
            <div className="mb-6 px-4 md:px-0">
              <div className="mb-3 items-start md:flex md:space-x-4">
                <div className="mb-3 grow md:mb-0">
                  <div className="flex flex-col-reverse md:flex-row">
                    <h1 className="mb-2 grow text-3xl leading-tight">
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
                <div className="mb-4 w-fit max-w-2xl whitespace-pre-line rounded-xl bg-white px-4 py-3 text-lg leading-relaxed text-slate-600 shadow-sm">
                  <TruncatedLinkify>
                    {preventWidows(poll.description)}
                  </TruncatedLinkify>
                </div>
              ) : null}
              {poll.location ? (
                <div className="mb-4 flex items-center">
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
            <React.Suspense fallback={<div>Loading…</div>}>
              <div className="mb-4 lg:mb-8">
                <PollComponent pollId={poll.urlId} highScore={highScore} />
              </div>
              <Discussion
                pollId={poll.urlId}
                canDelete={poll.role === "admin"}
              />
            </React.Suspense>
          </div>
        </div>
      </StandardLayout>
    </UserAvatarProvider>
  );
};

export const getServerSideProps: GetServerSideProps = async ({
  locale = "en",
}) => {
  try {
    return {
      props: {
        ...(await serverSideTranslations(locale, ["app"])),
      },
    };
  } catch {
    return { notFound: true };
  }
};

export default PollPageLoader;
