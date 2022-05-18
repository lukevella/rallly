import axios from "axios";
import { GetServerSideProps, NextPage } from "next";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { usePlausible } from "next-plausible";
import React from "react";

import FullPageLoader from "@/components/full-page-loader";
import { PollContextProvider } from "@/components/poll-context";
import { SessionProps, withSession } from "@/components/session";

import { ParticipantsProvider } from "../components/participants-provider";
import { withSessionSsr } from "../utils/auth";
import { trpc } from "../utils/trpc";
import { GetPollApiResponse } from "../utils/trpc/types";
import Custom404 from "./404";

const PollPage = dynamic(() => import("@/components/poll"), { ssr: false });

const PollPageLoader: NextPage<SessionProps> = () => {
  const { query } = useRouter();
  const { t } = useTranslation("app");
  const urlId = query.urlId as string;
  const plausible = usePlausible();
  const [notFound, setNotFound] = React.useState(false);
  const [legacyPoll, setLegacyPoll] = React.useState<GetPollApiResponse>();

  const pollQuery = trpc.useQuery(["polls.get", { urlId }], {
    onError: () => {
      if (process.env.NEXT_PUBLIC_LEGACY_POLLS === "1") {
        axios
          .get<GetPollApiResponse>(`/api/legacy/${urlId}`)
          .then(({ data }) => {
            plausible("Converted legacy event");
            setLegacyPoll(data);
          })
          .catch(() => setNotFound(true));
      } else {
        setNotFound(true);
      }
    },
    retry: false,
  });

  const poll = pollQuery.data ?? legacyPoll;

  if (poll) {
    return (
      <ParticipantsProvider pollId={poll.pollId}>
        <PollContextProvider value={poll}>
          <PollPage />
        </PollContextProvider>
      </ParticipantsProvider>
    );
  }

  if (notFound) {
    return <Custom404 />;
  }

  return <FullPageLoader>{t("loading")}</FullPageLoader>;
};

export const getServerSideProps: GetServerSideProps = withSessionSsr(
  async ({ locale = "en", req }) => {
    return {
      props: {
        ...(await serverSideTranslations(locale, ["app"])),
        user: req.session.user ?? null,
      },
    };
  },
);

export default withSession(PollPageLoader);
