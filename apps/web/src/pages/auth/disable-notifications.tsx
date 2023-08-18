import { DisableNotificationsPayload } from "@rallly/backend";
import {
  composeGetServerSideProps,
  withSessionSsr,
} from "@rallly/backend/next";
import { decryptToken } from "@rallly/backend/session";
import { prisma } from "@rallly/database";
import { BellIcon } from "@rallly/icons";
import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/router";
import { Trans, useTranslation } from "next-i18next";
import React from "react";
import { useMount } from "react-use";

import { AuthLayout } from "@/components/layouts/auth-layout";
import { StandardLayout } from "@/components/layouts/standard-layout";
import { Spinner } from "@/components/spinner";
import { NextPageWithLayout } from "@/types";
import { usePostHog } from "@/utils/posthog";
import { withPageTranslations } from "@/utils/with-page-translations";

const Redirect = (props: React.PropsWithChildren<{ redirect: string }>) => {
  const router = useRouter();
  const [enabled, setEnabled] = React.useState(false);
  const { t } = useTranslation();

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
          <BellIcon
            className={clsx("animate-popIn h-5", {
              "opacity-0": !enabled,
            })}
          />
        ) : (
          <Spinner />
        )}
      </div>
      <div className="text-gray-800">{props.children}</div>
      <div className="text-sm text-gray-500">
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

const Page: NextPageWithLayout<PageProps> = (props) => {
  const { t } = useTranslation();
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

Page.getLayout = (page) => {
  return <StandardLayout hideNav={true}>{page}</StandardLayout>;
};

export const getServerSideProps = composeGetServerSideProps(
  withPageTranslations(),
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
