import { prisma } from "@rallly/database";
import { GetStaticPaths, GetStaticProps } from "next";

const Page = () => {
  return null;
};

export default Page;

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: [],
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async (ctx) => {
  // We get these props to be able to render the og:image
  const poll = await prisma.poll.findUnique({
    where: {
      participantUrlId: ctx.params?.urlId as string,
    },
    select: {
      id: true,
    },
  });

  if (!poll) {
    return { props: {}, notFound: 404 };
  }

  return {
    props: {},
    redirect: {
      destination: `/poll/${poll.id}`,
      permanent: true,
    },
  };
};
