import "server-only";

import { prisma } from "@rallly/database";

/**
 * Yes and if-need-be counts per option, aggregated in the database so a
 * page that only shows totals never loads individual votes.
 */
export async function getOptionScores({ pollId }: { pollId: string }) {
  const rows = await prisma.vote.groupBy({
    by: ["optionId", "type"],
    where: { pollId, type: { in: ["yes", "ifNeedBe"] } },
    _count: { _all: true },
  });

  const scores = new Map<string, { yes: number; ifNeedBe: number }>();
  for (const row of rows) {
    const score = scores.get(row.optionId) ?? { yes: 0, ifNeedBe: 0 };
    if (row.type === "yes") {
      score.yes = row._count._all;
    } else if (row.type === "ifNeedBe") {
      score.ifNeedBe = row._count._all;
    }
    scores.set(row.optionId, score);
  }
  return scores;
}

/**
 * The viewer's own response: the most recently created one they may edit.
 * A viewer can hold several (a signed-in user who also voted as a guest),
 * but the page offers one response, so the loader picks it here rather
 * than leaving the choice to the client.
 */
export async function getViewerResponse({
  pollId,
  userId,
  participantIds,
}: {
  pollId: string;
  userId?: string;
  participantIds: string[];
}) {
  if (!userId && participantIds.length === 0) {
    return null;
  }

  const participant = await prisma.participant.findFirst({
    where: {
      pollId,
      OR: [
        ...(userId ? [{ userId }] : []),
        ...(participantIds.length > 0 ? [{ id: { in: participantIds } }] : []),
      ],
    },
    select: {
      id: true,
      name: true,
      votes: { select: { optionId: true, type: true } },
      user: { select: { image: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!participant) {
    return null;
  }

  return {
    participantId: participant.id,
    name: participant.name,
    image: participant.user?.image ?? null,
    votes: participant.votes,
  };
}

/** How many people have responded, for the per-option tallies. */
export async function countParticipants({ pollId }: { pollId: string }) {
  return prisma.participant.count({ where: { pollId } });
}
