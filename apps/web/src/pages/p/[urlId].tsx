/**
 * This page is used to redirect older links to the new invite page
 */
import { GetServerSideProps } from "next";

const Page = () => {
  return null;
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const participantUrlId = ctx.query.urlId as string;
  const res = await prisma?.poll.findUnique({
    where: {
      participantUrlId: participantUrlId,
    },
  });

  if (!res) {
    return { notFound: true };
  }

  return {
    redirect: {
      destination: `/invite/${res.id}`,
      permanent: true,
    },
  };
};

export default Page;
