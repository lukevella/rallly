import { prisma } from "../db";

export const getPollFromLink = async (urlId: string) => {
  const link = await prisma.link.findUnique({ where: { urlId } });

  if (!link) {
    throw new Error(`Link not found with id: ${urlId}`);
  }

  const poll = await prisma.poll.findUnique({
    where: {
      urlId: link.pollId,
    },
    include: {
      options: {
        orderBy: {
          value: "asc",
        },
      },
      participants: {
        include: {
          votes: true,
        },
        orderBy: [
          {
            createdAt: "desc",
          },
          { name: "desc" },
        ],
      },
      user: true,
      links: link.role === "admin",
    },
  });

  if (!poll) {
    throw new Error(`Poll not found with id: ${link.pollId}`);
  }

  return {
    ...poll,
    role: link.role,
    urlId: link.urlId,
    pollId: poll.urlId,
  };
};
