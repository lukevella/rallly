import "server-only";

import { prisma } from "@rallly/database";

export function listQueuedEmails({ ids }: { ids: string[] }) {
  return prisma.queuedEmail.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      kind: true,
      subjectId: true,
      attempts: true,
      user: { select: { banned: true } },
    },
  });
}

/** Emails in a final state last updated before the cutoff, oldest first. */
export async function listPurgeableQueuedEmailIds({
  cutoff,
  limit,
}: {
  cutoff: Date;
  limit: number;
}) {
  const rows = await prisma.queuedEmail.findMany({
    where: {
      status: { in: ["sent", "skipped", "failed"] },
      updatedAt: { lt: cutoff },
    },
    orderBy: { updatedAt: "asc" },
    select: { id: true },
    take: limit,
  });
  return rows.map((row) => row.id);
}
