import { prisma } from "@rallly/database";
import type { GetServerSideProps } from "next";

import { getServerSession } from "@/auth";
import type { DisableNotificationsPayload } from "@/trpc/types";
import { decryptToken } from "@/utils/session";

const Page = () => {
  return null;
};

export default Page;

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const token = ctx.query.token as string;
  const session = await getServerSession(ctx.req, ctx.res);

  if (!session || session.user.email === null) {
    return {
      props: {},
      redirect: {
        destination:
          "/login?callbackUrl=" + encodeURIComponent(ctx.req.url ?? "/"),
      },
    };
  }

  if (session && token) {
    const payload = await decryptToken<DisableNotificationsPayload>(token);
    if (payload) {
      const watcher = await prisma.watcher.findFirst({
        where: {
          userId: session.user.id,
          pollId: payload.pollId,
        },
      });

      if (watcher) {
        await prisma.watcher.delete({
          where: {
            id: watcher.id,
          },
        });
      }

      return {
        props: {},
        redirect: {
          destination: `/poll/${payload.pollId}`,
        },
      };
    }
  }

  return {
    props: {},
    notFound: true,
  };
};
