import { useTranslation } from "next-i18next";
import { NextSeo } from "next-seo";

import { AuthLayout } from "@/components/layouts/auth-layout";
import { withPageTranslations } from "@/utils/with-page-translations";

const Page = () => {
  const { t } = useTranslation("app");
  return (
    <AuthLayout title={t("expiredOrInvalidLink")}>
      <NextSeo
        title={t("expiredOrInvalidLink")}
        nofollow={true}
        noindex={true}
      />
      {t("expiredOrInvalidLink")}
    </AuthLayout>
  );
};

export const getStaticProps = withPageTranslations(["app"]);

export default Page;
