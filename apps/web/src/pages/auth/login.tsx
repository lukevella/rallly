import { trpc } from "@rallly/backend";
import { CheckCircleIcon } from "@rallly/icons";
import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/router";
import { Trans, useTranslation } from "next-i18next";
import { useMount } from "react-use";

import { AuthLayout } from "@/components/layouts/auth-layout";
import { StandardLayout } from "@/components/layouts/standard-layout";
import { Spinner } from "@/components/spinner";
import { NextPageWithLayout } from "@/types";
import { usePostHog } from "@/utils/posthog";
import { getStaticTranslations } from "@/utils/with-page-translations";

const defaultRedirectPath = "/polls";

const Page: NextPageWithLayout = () => {
  const { t } = useTranslation();

  const router = useRouter();
  const { token } = router.query;
  const posthog = usePostHog();
  const queryClient = trpc.useContext();

  const authenticate = trpc.whoami.authenticate.useMutation();

  useMount(() => {
    authenticate.mutate(
      { token: token as string },
      {
        onSuccess: (user) => {
          posthog?.identify(user.id, {
            name: user.name,
            email: user.email,
          });
          queryClient.invalidate();
          setTimeout(() => {
            router.replace(defaultRedirectPath);
          }, 1000);
        },
      },
    );
  });

  return (
    <AuthLayout title={t("login")}>
      {authenticate.isLoading ? (
        <div className="flex items-center gap-4">
          <Spinner />
          <Trans i18nKey="loading" />
        </div>
      ) : authenticate.isSuccess ? (
        <div className="space-y-2">
          <div className="flex h-10 items-center justify-center gap-4">
            <CheckCircleIcon className={clsx("h-8 text-green-500")} />
          </div>
          <div className="text-gray-800">{t("loginSuccessful")}</div>
          <div className="text-sm text-gray-500">
            <Trans
              t={t}
              i18nKey="redirect"
              components={{
                a: <Link className="underline" href={defaultRedirectPath} />,
              }}
            />
          </div>
        </div>
      ) : (
        <div>
          <Trans i18nKey="expiredOrInvalidLink" />
        </div>
      )}
    </AuthLayout>
  );
};

Page.getLayout = (page) => {
  return <StandardLayout hideNav={true}>{page}</StandardLayout>;
};

export default Page;

export const getStaticProps = getStaticTranslations;
