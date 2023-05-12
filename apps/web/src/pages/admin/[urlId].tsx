import { prisma } from "@rallly/database";
import { GetServerSideProps } from "next";

export default function Page() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const res = await prisma.poll.findUnique({
    where: {
      adminUrlId: ctx.params?.urlId as string,
    },
    select: {
      participantUrlId: true,
    },
  });

  if (!res) {
    return {
      notFound: true,
    };
  }

  return {
    redirect: {
      destination: `/poll/${res.participantUrlId}?adminToken=${ctx.params?.urlId}`,
      permanent: true,
    },
  };
};
