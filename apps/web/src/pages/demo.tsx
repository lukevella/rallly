import { trpc } from "@rallly/backend";
import { withAuthIfRequired, withSessionSsr } from "@rallly/backend/next";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import React from "react";
import { useMount } from "react-use";

import { usePostHog } from "@/utils/posthog";

import FullPageLoader from "../components/full-page-loader";
import { withSession } from "../components/user-provider";
import { withPageTranslations } from "../utils/with-page-translations";

const Demo: NextPage = () => {
  const { t } = useTranslation("app");

  const router = useRouter();
  const createDemo = trpc.polls.demo.create.useMutation();
  const posthog = usePostHog();
  useMount(async () => {
    const urlId = await createDemo.mutateAsync();
    posthog?.capture("create demo poll");
    router.replace(`/admin/${urlId}`);
  });

  return <FullPageLoader>{t("creatingDemo")}</FullPageLoader>;
};

export const getServerSideProps = withSessionSsr([
  withAuthIfRequired,
  withPageTranslations(["common", "app"]),
]);

export default withSession(Demo);
