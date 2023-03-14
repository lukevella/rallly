import { GetServerSideProps } from "next";

import Home from "@/components/home";
import { withPageTranslations } from "@/utils/with-page-translations";

export default function Page() {
  return <Home />;
}

export const getServerSideProps: GetServerSideProps = withPageTranslations([
  "common",
  "homepage",
]);
