import { GetServerSideProps } from "next";
import dynamic from "next/dynamic";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import { withSessionSsr } from "../utils/auth";

export const getServerSideProps: GetServerSideProps = withSessionSsr(
  async ({ locale = "en", query, req }) => {
    return {
      props: {
        ...(await serverSideTranslations(locale, ["app"])),
        ...query,
        user: req.session.user ?? null,
      },
    };
  },
);

export default dynamic(() => import("@/components/create-poll"), {
  ssr: false,
});
