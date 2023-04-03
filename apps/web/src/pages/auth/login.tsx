import { LoginTokenPayload } from "@rallly/backend";
import {
  composeGetServerSideProps,
  withSessionSsr,
} from "@rallly/backend/next";
import { decryptToken } from "@rallly/backend/session";
import { prisma } from "@rallly/database";
import CheckCircle from "@rallly/icons/check-circle.svg";
import clsx from "clsx";
import { GetServerSideProps } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { Trans, useTranslation } from "next-i18next";
import React from "react";

import { AuthLayout } from "@/components/layouts/auth-layout";
import { Spinner } from "@/components/spinner";
import { withPageTranslations } from "@/utils/with-page-translations";

const defaultRedirectPath = "/profile";

const redirectToInvalidToken = {
  redirect: {
    destination: "/auth/invalid-token",
    permanent: false,
  },
};

const Redirect = () => {
  const { t } = useTranslation("app");
  const [enabled, setEnabled] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    setTimeout(() => {
      setEnabled(true);
    }, 500);
    setTimeout(() => {
      router.replace(defaultRedirectPath);
    }, 3000);
  }, [router]);

  return (
    <div className="space-y-2">
      <div className="flex h-10 items-center justify-center gap-4">
        {enabled ? (
          <CheckCircle
            className={clsx("animate-popIn h-10 text-green-500", {
              "opacity-0": !enabled,
            })}
          />
        ) : (
          <Spinner />
        )}
      </div>
      <div className="text-slate-800">{t("loginSuccessful")}</div>
      <div className="text-sm text-slate-500">
        <Trans
          t={t}
          i18nKey="redirect"
          components={{
            a: <Link className="underline" href={defaultRedirectPath} />,
          }}
        />
      </div>
    </div>
  );
};
export const Page = (
  props:
    | {
        success: true;
        name: string;
      }
    | {
        success: false;
        errorCode: "userNotFound";
      },
) => {
  const { t } = useTranslation("app");
  return (
    <AuthLayout title={t("login")}>
      {props.success ? (
        <Redirect />
      ) : (
        <Trans t={t} i18nKey="userDoesNotExist" />
      )}
    </AuthLayout>
  );
};

export default Page;

export const getServerSideProps: GetServerSideProps = composeGetServerSideProps(
  withPageTranslations(["app"]),
  withSessionSsr(async (ctx) => {
    const token = ctx.query.token as string;

    if (!token) {
      // token is missing
      return redirectToInvalidToken;
    }

    const payload = await decryptToken<LoginTokenPayload>(token);

    if (!payload) {
      // token is invalid or expired
      return redirectToInvalidToken;
    }

    const user = await prisma.user.findFirst({
      select: {
        id: true,
      },
      where: { id: payload.userId },
    });

    if (!user) {
      // user does not exist
      return {
        props: {
          success: false,
          errorCode: "userNotFound",
        },
      };
    }

    ctx.req.session.user = { id: user.id, isGuest: false };

    await ctx.req.session.save();

    return {
      props: {
        success: true,
      },
    };
  }),
);
