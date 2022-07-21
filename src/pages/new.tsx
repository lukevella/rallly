import { GetServerSideProps } from "next";
import dynamic from "next/dynamic";

import { withSessionSsr } from "../utils/auth";
import { withPageTranslations } from "../utils/with-page-translations";

export const getServerSideProps: GetServerSideProps = withSessionSsr(
  withPageTranslations(["common", "app"]),
);

export default dynamic(() => import("@/components/create-poll"), {
  ssr: false,
});
