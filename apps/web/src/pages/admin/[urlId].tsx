import { withSessionSsr } from "@rallly/backend/next";
import { prisma } from "@rallly/database";
import { GetServerSideProps } from "next";

export default function Page() {
  return null;
}

export const getServerSideProps: GetServerSideProps = withSessionSsr(
  async (ctx) => {
    const res = await prisma.poll.findUnique({
      where: {
        adminUrlId: ctx.params?.urlId as string,
      },
      select: {
        id: true,
      },
    });

    if (!res) {
      return {
        notFound: true,
      };
    }

    if (ctx.req.session.user) {
      const { pollIds } = ctx.req.session.user;
      ctx.req.session.user.pollIds = pollIds
        ? pollIds.includes(res.id)
          ? pollIds
          : [...pollIds, res.id]
        : [res.id];
      await ctx.req.session.save();
    }

    return {
      redirect: {
        destination: `/poll/${res.id}`,
        permanent: false,
      },
    };
  },
);
