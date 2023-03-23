import { prisma } from "@rallly/database";
import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/router";
import { Trans, useTranslation } from "next-i18next";
import React from "react";
import { useMount } from "react-use";

import Bell from "@/components/icons/bell-crossed.svg";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { Spinner } from "@/components/spinner";
import {
  composeGetServerSideProps,
  decryptToken,
  DisableNotificationsPayload,
  withSessionSsr,
} from "@/utils/auth";
import { usePostHog } from "@/utils/posthog";
import { withPageTranslations } from "@/utils/with-page-translations";

const Redirect = (props: React.PropsWithChildren<{ redirect: string }>) => {
  const router = useRouter();
  const [enabled, setEnabled] = React.useState(false);
  const { t } = useTranslation("app");

  useMount(() => {
    setTimeout(() => {
      setEnabled(true);
    }, 500);

    setTimeout(() => {
      router.replace(props.redirect);
    }, 3000);
  });

  return (
    <div>
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
      <div className="text-slate-800">{props.children}</div>
      <div className="text-sm text-slate-500">
        <Trans
          t={t}
          i18nKey="redirect"
          components={{
            a: <Link className="underline" href={props.redirect} />,
          }}
        />
      </div>
    </div>
  );
};

type Data = { title: string; adminUrlId: string; pollId: string };

type PageProps =
  | {
      error: "pollNotFound" | "invalidToken";
      data: undefined;
    }
  | { error: undefined; data: Data };

const Page = (props: PageProps) => {
  const { t } = useTranslation("app");
  const posthog = usePostHog();

  useMount(() => {
    if (!props.error) {
      posthog?.capture("turned notifications off", {
        pollId: props.data.pollId,
        // where the event was triggered from
        source: "email",
      });
    }
  });

  return (
    <AuthLayout title={t("loading")}>
      {props.error !== undefined ? (
        <div>{props.error}</div>
      ) : (
        <Redirect redirect={`/admin/${props.data.adminUrlId}`}>
          <Trans
            t={t}
            i18nKey="notificationsDisabled"
            values={{ title: props.data.title }}
            components={{ b: <strong /> }}
          />
        </Redirect>
      )}
    </AuthLayout>
  );
};

export const getServerSideProps = composeGetServerSideProps(
  withPageTranslations(["app"]),
  withSessionSsr(async (ctx) => {
    const token = ctx.query.token as string;

    const payload = await decryptToken<DisableNotificationsPayload>(token);

    if (!payload) {
      return {
        props: {
          errorCode: "invalidToken",
        },
      };
    }

    const watcher = await prisma.watcher.findUnique({
      select: {
        id: true,
        poll: {
          select: {
            adminUrlId: true,
            title: true,
          },
        },
      },
      where: {
        id: payload.watcherId,
      },
    });

    if (watcher) {
      await prisma.watcher.delete({
        where: {
          id: watcher.id,
        },
      });

      return {
        props: {
          data: {
            title: watcher.poll.title,
            adminUrlId: watcher.poll.adminUrlId,
          },
        },
      };
    } else {
      const poll = await prisma.poll.findFirst({
        where: { id: payload.pollId },
        select: { adminUrlId: true, title: true, id: true },
      });

      if (!poll) {
        return {
          props: {
            errorCode: "pollNotFound",
          },
        };
      }

      return {
        props: {
          data: {
            adminUrlId: poll.adminUrlId,
            title: poll.title,
            pollId: poll.id,
          },
        },
      };
    }
  }),
);

export default Page;
