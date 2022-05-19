import { Link, Option, Poll, User } from "@prisma/client";
import { TRPCError } from "@trpc/server";

import { prisma } from "~/prisma/db";

import { GetPollApiResponse } from "./trpc/types";

export const getDefaultPollInclude = <V extends boolean>(
  includeLinks: V,
): {
  options: {
    orderBy: {
      value: "asc";
    };
  };
  user: true;
  links: V;
} => {
  return {
    options: {
      orderBy: {
        value: "asc",
      },
    },
    user: true,
    links: includeLinks,
  };
};

export const getLink = async (urlId: string) => {
  const link = await prisma.link.findUnique({
    where: {
      urlId,
    },
  });

  if (!link) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `Link not found with id: ${urlId}`,
    });
  }

  return link;
};

export const getPollFromLink = async (
  link: Link,
): Promise<GetPollApiResponse> => {
  const poll = await prisma.poll.findUnique({
    where: {
      urlId: link.pollId,
    },
    include: getDefaultPollInclude(link.role === "admin"),
  });

  if (!poll) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `Poll not found with id: ${link.pollId}`,
    });
  }

  return createPollResponse(poll, link);
};

export const createPollResponse = (
  poll: Poll & {
    options: Option[];
    user: User;
    links: Link[];
  },
  link: Link,
): GetPollApiResponse => {
  return {
    ...poll,
    role: link.role,
    urlId: link.urlId,
    pollId: poll.urlId,
  };
};
