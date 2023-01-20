import { GetServerSideProps } from "next";

import CreatePoll from "@/components/create-poll";

import { withSessionSsr } from "../utils/auth";
import { withPageTranslations } from "../utils/with-page-translations";

export default CreatePoll;

export const getServerSideProps: GetServerSideProps = withSessionSsr(
  withPageTranslations(["common", "app"]),
);
