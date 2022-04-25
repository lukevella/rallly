import { GetServerSideProps, NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import StandardLayout from "@/components/standard-layout";

const Page: NextPage = () => {
  return (
    <StandardLayout>
      <div>Preferences</div>
    </StandardLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async ({
  locale = "en",
  query,
}) => {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["app"])),
      ...query,
    },
  };
};

export default Page;
