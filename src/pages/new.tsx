import { GetServerSideProps } from "next";
import dynamic from "next/dynamic";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import { CreatePollPageProps } from "@/components/create-poll";
import { withSessionSsr } from "@/utils/auth";

const getProps: GetServerSideProps<CreatePollPageProps> = async ({
  locale = "en",
  query,
  req,
}) => {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["app"])),
      ...query,
      user: req.session.user ?? null,
    },
  };
};

export const getServerSideProps = withSessionSsr(getProps);

// We disable SSR because the data on this page relies on sessionStore
export default dynamic(() => import("@/components/create-poll"), {
  ssr: false,
});
