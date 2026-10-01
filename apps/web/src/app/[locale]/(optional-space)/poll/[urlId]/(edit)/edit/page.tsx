import { buttonVariants } from "@rallly/ui";
import { Card } from "@rallly/ui/card";
import { CalendarCheck2Icon } from "lucide-react";
import { Suspense } from "react";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateFooter,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { Link } from "@/components/link";
import { EditPoll } from "@/features/poll/components/edit-poll";
import {
  loadAdminPoll,
  loadPollConferencingOptions,
} from "@/features/poll/loaders";
import { Trans } from "@/i18n/client";

async function EditPollPage({
  params,
  searchParams,
}: {
  params: Promise<{ urlId: string }>;
  searchParams: Promise<{ from?: string | string[] }>;
}) {
  const [{ urlId }, { from }] = await Promise.all([params, searchParams]);
  // Only a known surface can be returned to, so the param can't redirect
  // off site.
  const returnHref = from === "admin" ? `/polls/${urlId}` : `/poll/${urlId}`;
  const [{ poll }, conferencing] = await Promise.all([
    loadAdminPoll(urlId),
    loadPollConferencingOptions(urlId),
  ]);

  // A booked event keeps its own copy of the poll's details, so edits made
  // after booking would never reach it. The server rejects them too.
  if (poll.status === "scheduled") {
    return (
      <Card>
        <EmptyState>
          <EmptyStateIcon>
            <CalendarCheck2Icon />
          </EmptyStateIcon>
          <EmptyStateTitle>
            <Trans
              i18nKey="scheduledPollLockedTitle"
              defaults="This poll is scheduled"
            />
          </EmptyStateTitle>
          <EmptyStateDescription>
            <Trans
              i18nKey="scheduledPollLockedDescription"
              defaults="A scheduled poll can no longer be edited."
            />
          </EmptyStateDescription>
          <EmptyStateFooter>
            <Link href={returnHref} className={buttonVariants()}>
              <Trans i18nKey="backToPoll" defaults="Back to poll" />
            </Link>
          </EmptyStateFooter>
        </EmptyState>
      </Card>
    );
  }

  return <EditPoll conferencing={conferencing} returnHref={returnHref} />;
}

export default function Page({
  params,
  searchParams,
}: {
  params: Promise<{ urlId: string }>;
  searchParams: Promise<{ from?: string | string[] }>;
}) {
  return (
    <Suspense>
      <EditPollPage params={params} searchParams={searchParams} />
    </Suspense>
  );
}
