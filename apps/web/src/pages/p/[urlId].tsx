/**
 * This page is used to redirect older links to the new invite page
 */
import { prisma } from "@rallly/database";
import { GetServerSideProps } from "next";

const Page = () => {
  return null;
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const participantUrlId = ctx.query.urlId as string;
  const token = ctx.query.token as string;

  const res = await prisma.poll.findUnique({
    where: {
      participantUrlId: participantUrlId,
    },
    select: {
      id: true,
    },
  });

  if (!res) {
    return { notFound: true };
  }

  return {
    redirect: {
      destination: `/invite/${res.id}${token ? `?token=${token}` : ""}`,
      permanent: true,
    },
  };
};

export default Page;
