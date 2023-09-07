import { trpc } from "@rallly/backend";
import {
  composeGetServerSideProps,
  withSessionSsr,
} from "@rallly/backend/next";
import { prisma } from "@rallly/database";
import { ArrowRightIcon, ShieldCloseIcon } from "@rallly/icons";
import { Button } from "@rallly/ui/button";
import { GetServerSideProps } from "next";
import Link from "next/link";
import { useRouter } from "next/router";

import { getStandardLayout } from "@/components/layouts/standard-layout";
import {
  PageDialog,
  PageDialogContent,
  PageDialogDescription,
  PageDialogFooter,
  PageDialogHeader,
  PageDialogTitle,
} from "@/components/page-dialog";
import { Trans } from "@/components/trans";
import { CurrentUserAvatar, UserAvatar } from "@/components/user";
import { useUser } from "@/components/user-provider";
import { NextPageWithLayout } from "@/types";
import { withPageTranslations } from "@/utils/with-page-translations";

const Page: NextPageWithLayout<{ userId: string; pollId: string }> = ({
  pollId,
  userId,
}) => {
  const { user } = useUser();
  const router = useRouter();
  const transfer = trpc.polls.transfer.useMutation({
    onSuccess: () => {
      router.replace(`/poll/${pollId}`);
    },
  });

  return (
    <PageDialog icon={ShieldCloseIcon}>
      <PageDialogHeader>
        <PageDialogTitle>
          <Trans i18nKey="differentOwner" defaults="Different Owner" />
        </PageDialogTitle>
        <PageDialogDescription>
          <Trans
            i18nKey="differentOwnerDescription"
            defaults="This poll was created by a different user. Would you like to transfer ownership to the current user?"
          />
        </PageDialogDescription>
      </PageDialogHeader>
      <PageDialogContent>
        <div className="flex items-center justify-center gap-3">
          <div className="flex items-center gap-x-2.5">
            <UserAvatar />
            <div>{userId.slice(0, 10)}</div>
          </div>
          <ArrowRightIcon className="text-muted-foreground h-4 w-4" />
          <div className="flex items-center gap-x-2.5">
            <CurrentUserAvatar />
            <div>{user.name}</div>
          </div>
        </div>
      </PageDialogContent>
      <PageDialogFooter>
        <Button
          size="lg"
          loading={transfer.isLoading}
          variant="primary"
          onClick={() => {
            transfer.mutate({ pollId });
          }}
        >
          <Trans
            i18nKey="yesTransfer"
            defaults="Yes, transfer to current user"
          />
        </Button>
        <Button asChild size="lg">
          <Link href="/polls">
            <Trans i18nKey="noTransfer" defaults="No, take me home" />
          </Link>
        </Button>
      </PageDialogFooter>
    </PageDialog>
  );
};

Page.getLayout = getStandardLayout;

export default Page;

export const getServerSideProps: GetServerSideProps = withSessionSsr(
  composeGetServerSideProps(async (ctx) => {
    const res = await prisma.poll.findUnique({
      where: {
        adminUrlId: ctx.params?.urlId as string,
      },
      select: {
        id: true,
        userId: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!res) {
      return {
        notFound: true,
      };
    }

    // if the poll was created by a registered user or the current user is the creator
    if (res.user || ctx.req.session.user?.id === res.userId) {
      // redirect to the poll page
      return {
        redirect: {
          destination: `/poll/${res.id}`,
          permanent: false,
        },
      };
    }

    // otherwise allow the current user to take ownership of the poll
    return {
      props: {
        userId: res.userId,
        pollId: res.id,
      },
    };
  }, withPageTranslations()),
);
