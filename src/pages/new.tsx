import { GetServerSideProps } from "next";

import CreatePoll from "@/components/create-poll";

import { withSession } from "../components/user-provider";
import { withSessionSsr } from "../utils/auth";
import { withPageTranslations } from "../utils/with-page-translations";

export default withSession(CreatePoll);

export const getServerSideProps: GetServerSideProps = withSessionSsr(
  withPageTranslations(["common", "app"]),
);
