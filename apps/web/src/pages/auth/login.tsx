import { trpc } from "@rallly/backend";
import { withSessionSsr } from "@rallly/backend/next";
import { CheckCircleIcon } from "@rallly/icons";
import clsx from "clsx";
import { GetServerSideProps } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { Trans, useTranslation } from "next-i18next";
import { useMount } from "react-use";

import { AuthLayout } from "@/components/layouts/auth-layout";
import { Spinner } from "@/components/spinner";
import { withSession } from "@/components/user-provider";
import { usePostHog } from "@/utils/posthog";
import { withPageTranslations } from "@/utils/with-page-translations";

const defaultRedirectPath = "/polls";

export const Page = () => {
  const { t } = useTranslation();

  const router = useRouter();
  const { token } = router.query;
  const posthog = usePostHog();
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

export default withSession(Page);

export const getServerSideProps: GetServerSideProps = withSessionSsr(
  withPageTranslations(),
);
