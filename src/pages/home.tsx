import { GetServerSideProps } from "next";

import { withPageTranslations } from "../utils/with-page-translations";

export { default } from "@/components/home";

export const getServerSideProps: GetServerSideProps = withPageTranslations([
  "common",
  "homepage",
]);
