import { Button } from "@rallly/ui/button";
import { GetServerSideProps } from "next";
import { z } from "zod";

import { Logo } from "@/components/logo";
import { Skeleton } from "@/components/skeleton";
import { Trans } from "@/components/trans";
import { UserAvatar } from "@/components/user";
import { NextPageWithLayout } from "@/types";
import { trpc } from "@/utils/trpc/client";
import { getServerSideTranslations } from "@/utils/with-page-translations";

const params = z.object({
  email: z.string(),
  magicLink: z.string(),
});

type PageProps = z.infer<typeof params>;

const Page: NextPageWithLayout<PageProps> = ({ magicLink, email }) => {
  const { data } = trpc.user.getByEmail.useQuery({ email });

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 p-4">
      <div className="mb-6">
        <Logo />
      </div>

      <div className="shadow-huge rounded-md bg-white p-4">
        <div className="w-48 text-center">
          <div className="mb-4 font-semibold">
            <Trans i18nKey="continueAs" defaults="Continue as" />
          </div>
          <div className="text-center">
            <UserAvatar size="lg" name={data?.name} />
            <div className="py-4 text-center">
              <div className="mb-1 h-6 font-medium">
                {data?.name ?? <Skeleton className="inline-block h-5 w-16" />}
              </div>
              <div className="text-muted-foreground h-5 truncate text-sm">
                {data?.email ?? (
                  <Skeleton className="inline-block h-full w-20" />
                )}
              </div>
            </div>
          </div>
          <Button asChild size="lg" variant="primary" className="mt-4 w-full">
            <a role="link" href={magicLink}>
              <Trans i18nKey="continue" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const parse = params.safeParse(ctx.query);
  if (!parse.success) {
    return {
      notFound: true,
    };
  }
  const { email, magicLink } = parse.data;
  return {
    props: {
      email,
      magicLink,
      ...getServerSideTranslations(ctx),
    },
  };
};

export default Page;
