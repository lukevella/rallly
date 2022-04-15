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
import Popover from "@/components/popover";
import Sharing from "@/components/sharing";
import StandardLayout from "@/components/standard-layout";
import { PollContext, usePoll } from "@/components/use-poll";
import { useUserName } from "@/components/user-name-context";
import axios from "axios";
import { GetServerSideProps, NextPage } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { usePlausible } from "next-plausible";
import Head from "next/head";
import { useRouter } from "next/router";
import React from "react";
import { toast } from "react-hot-toast";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useMount } from "react-use";
import { preventWidows } from "utils/prevent-widows";
import { GetPollResponse } from "../api-client/get-poll";
import { getBrowserTimeZone } from "../utils/date-time-utils";
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
    <PollContext.Provider value={poll}>
      <PollPage />
    </PollContext.Provider>
  );
};

const PollPage: NextPage = () => {
  const poll = usePoll();

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

  const [targetTimeZone, setTargetTimeZone] =
    React.useState(getBrowserTimeZone);

  const sortedOptions = React.useMemo(
    () =>
      poll.options.sort((a, b) =>
        a.value < b.value ? -1 : a.value > b.value ? 1 : 0,
      ),
    [poll.options],
  );

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
  sortedOptions.forEach((option) => {
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
        <div className="max-w-full lg:w-[1024px] bg-gray-50 relative py-4 md:px-4 lg:px-8">
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
              <div className="md:flex md:space-x-4 items-start mb-3">
                <div className="mb-3 md:mb-0 grow">
                  <div className="flex flex-col-reverse md:flex-row">
                    <h1 className="grow mb-2 leading-tight text-3xl">
                      {preventWidows(poll.title)}
                    </h1>
                    {poll.role === "admin" ? (
                      <div className="flex space-x-2 mb-4 md:mb-2">
                        <NotificationsToggle />
                        <ManagePoll
                          placement={
                            isWideScreen ? "bottom-end" : "bottom-start"
                          }
                          targetTimeZone={targetTimeZone}
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
                <div className="text-lg leading-relaxed max-w-2xl mb-4 whitespace-pre-line w-fit shadow-sm bg-white text-slate-600 rounded-xl px-4 py-3">
                  <TruncatedLinkify>
                    {preventWidows(poll.description)}
                  </TruncatedLinkify>
                </div>
              ) : null}
              {poll.location ? (
                <div className="flex items-center mb-4">
                  <div>
                    <LocationMarker
                      width={20}
                      className="text-slate-400 mr-2"
                    />
                  </div>
                  <TruncatedLinkify>{poll.location}</TruncatedLinkify>
                </div>
              ) : null}
            </div>
            {poll.closed ? (
              <div className="bg-sky-100 text-sky-700 py-3 px-4 md:rounded-lg shadow-sm mb-4 flex items-center">
                <div className="mr-3 rounded-md">
                  <LockClosed className="w-5" />
                </div>
                This poll has been locked (voting is disabled)
              </div>
            ) : null}
            <React.Suspense fallback={<div>Loading…</div>}>
              <div className="mb-4 lg:mb-8">
                <PollComponent
                  pollId={poll.urlId}
                  role={poll.role}
                  timeZone={poll.timeZone}
                  options={sortedOptions}
                  participants={poll.participants}
                  highScore={highScore}
                  targetTimeZone={targetTimeZone}
                  onChangeTargetTimeZone={setTargetTimeZone}
                />
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
