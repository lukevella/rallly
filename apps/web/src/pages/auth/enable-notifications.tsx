import { prisma } from "@rallly/database";
import clsx from "clsx";
import { GetServerSideProps } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { Trans, useTranslation } from "next-i18next";
import React from "react";

import Bell from "@/components/icons/bell.svg";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { Spinner } from "@/components/spinner";
import {
  composeGetServerSideProps,
  decryptToken,
  EnableNotificationsTokenPayload,
} from "@/utils/auth";
import { withPageTranslations } from "@/utils/with-page-translations";

interface PageProps {
  title: string;
  adminUrlId: string;
}

const Page = ({ title, adminUrlId }: PageProps) => {
  const router = useRouter();

  const { t } = useTranslation("app");
  const [enabled, setEnabled] = React.useState(false);

  React.useEffect(() => {
    setTimeout(() => {
      setEnabled(true);
    }, 500);

    setTimeout(() => {
      router.replace(`/admin/${adminUrlId}`);
    }, 3000);
  }, [router, adminUrlId]);

  return (
    <AuthLayout title={t("loading")}>
      <div className="flex h-8 items-center justify-center gap-4">
        {enabled ? (
          <Bell
            className={clsx("animate-popIn h-5", {
              "opacity-0": !enabled,
            })}
          />
        ) : (
          <Spinner />
        )}
      </div>
      <div className="text-slate-800">
        <Trans
          t={t}
          i18nKey="notificationsEnabled"
          values={{ title }}
          components={{ b: <strong /> }}
        />
      </div>
      <div className="text-sm text-slate-500">
        <Trans
          t={t}
          i18nKey="redirect"
          components={{
            a: <Link className="underline" href={`/admin/${adminUrlId}`} />,
          }}
        />
      </div>
    </AuthLayout>
  );
};

const redirectToInvalidToken = {
  redirect: {
    destination: "/auth/invalid-token",
    permanent: false,
  },
};

export const getServerSideProps: GetServerSideProps = composeGetServerSideProps(
  withPageTranslations(["app"]),
  async (ctx) => {
    const token = ctx.query.token as string;

    if (!token) {
      return redirectToInvalidToken;
    }

    const payload = await decryptToken<EnableNotificationsTokenPayload>(token);

    if (payload) {
      const poll = await prisma.poll.findFirst({
        select: {
          title: true,
        },
        where: { adminUrlId: payload.adminUrlId },
      });

      if (!poll) {
        return {
          redirect: {
            destination: `/admin/${payload.adminUrlId}`,
            permanent: false,
          },
        };
      }

      await prisma.poll.update({
        data: {
          notifications: true,
          verified: true,
        },
        where: { adminUrlId: payload.adminUrlId },
      });

      return {
        props: { title: poll.title, adminUrlId: payload.adminUrlId },
      };
    } else {
      return redirectToInvalidToken;
    }
  },
);

export default Page;
