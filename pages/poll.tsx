import axios from "axios";
import { GetServerSideProps, NextPage } from "next";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { usePlausible } from "next-plausible";
import React from "react";
import { useQuery } from "react-query";
import { withSessionSsr } from "utils/auth";

import ErrorPage from "@/components/error-page";
import FullPageLoader from "@/components/full-page-loader";
import { SessionProps, withSession } from "@/components/session";

import { GetPollResponse } from "../api-client/get-poll";
import Custom404 from "./404";

const PollPage = dynamic(() => import("@/components/poll"), { ssr: false });

const PollPageLoader: NextPage<SessionProps> = () => {
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

  if (poll) {
    return <PollPage poll={poll} />;
  }

  if (didError) {
    return <Custom404 />;
  }

  return <FullPageLoader>{t("loading")}</FullPageLoader>;
};

export const getServerSideProps: GetServerSideProps = withSessionSsr(
  async ({ locale = "en", req }) => {
    try {
      return {
        props: {
          ...(await serverSideTranslations(locale, ["app"])),
          user: req.session.user ?? null,
        },
      };
    } catch {
      return { notFound: true };
    }
  },
);

export default withSession(PollPageLoader);
