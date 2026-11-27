import { MessageCircleIcon, UsersIcon } from "lucide-react";
import { Trans } from "react-i18next/TransWithoutContext";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import {
  PageColumn,
  PageContent,
  PageHeader,
  PageShell,
  PageTitle,
} from "@/components/page";
import { PollProvider } from "@/features/poll/client";
import { PollAdminMenu } from "@/features/poll/components/poll-admin-menu";
import { loadPollInvites } from "@/features/poll/invite/loaders";
import { loadAdminPoll } from "@/features/poll/loaders";
import { getTranslation } from "@/i18n/server";
import { RelativeTime } from "@/lib/datetime/relative-time";
import { PollBreadcrumb } from "./components/poll-breadcrumb";
import { PollComments } from "./components/poll-comments";
import { PollDetails } from "./components/poll-details";
import { PollParticipantsSection } from "./components/poll-participants";
import { PollResults } from "./components/poll-results";
import { PollSection, PollSections } from "./components/poll-section";
import { PollStatusCard } from "./components/poll-status-card";
import { PollStatusLabel } from "./components/poll-status-label";

export default async function Page({
  params,
}: {
  params: Promise<{ pollId: string }>;
}) {
  const { pollId } = await params;
  const [{ poll, participants, comments }, invites, { t, i18n }] =
    await Promise.all([
      loadAdminPoll(pollId),
      loadPollInvites(pollId),
      getTranslation(),
    ]);

  const invitedParticipantIds = new Set(
    invites.flatMap((invite) =>
      invite.participantId ? [invite.participantId] : [],
    ),
  );

  const responded = [...participants]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((participant) => ({
      id: participant.id,
      name: participant.name,
      image: participant.image,
      note: participant.note,
      respondedAt: participant.createdAt,
      viaInvite: invitedParticipantIds.has(participant.id),
      editUrl: participant.editUrl,
    }));

  const oldestFirstComments = [...comments].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );

  const lastComment = oldestFirstComments.at(-1);

  return (
    <PageShell
      nav={
        <PollBreadcrumb
          title={poll.title}
          status={<PollStatusLabel status={poll.status} />}
          headingId="poll-title"
        />
      }
      navActions={
        // The menu reads the poll from the poll provider.
        <PollProvider
          poll={poll}
          participants={participants}
          comments={comments}
          viewerRole="admin"
        >
          <PollAdminMenu />
        </PollProvider>
      }
    >
      <PageHeader>
        <PageColumn>
          <PageTitle
            id="poll-title"
            badge={<PollStatusLabel status={poll.status} />}
          >
            {poll.title}
          </PageTitle>
          <PollDetails poll={poll} />
        </PageColumn>
      </PageHeader>
      <PageContent>
        <PageColumn>
          <div className="flex flex-col gap-8 px-4 pt-6 pb-16">
            {/* The finalize dialog and participant menus read the poll from the provider */}
            <PollProvider
              poll={poll}
              participants={participants}
              comments={comments}
              viewerRole="admin"
            >
              <PollStatusCard
                pollId={poll.id}
                status={poll.status}
                inviteLink={poll.inviteLink}
                responseCount={participants.length}
                invitedCount={invites.length}
                awaitingCount={
                  invites.filter((invite) => !invite.participantId).length
                }
                event={poll.event}
                floating={poll.timeZone === null}
              />
              <PollSections>
                <PollResults
                  title={
                    <Trans
                      t={t}
                      i18n={i18n}
                      ns="app"
                      i18nKey="pollResultsHeading"
                      defaults="Results"
                    />
                  }
                  options={poll.options}
                  participants={participants}
                  timeZone={poll.timeZone}
                  canPick={poll.status !== "scheduled"}
                />
                <PollParticipantsSection
                  participants={responded}
                  title={
                    <Trans
                      t={t}
                      i18n={i18n}
                      ns="app"
                      i18nKey="participants"
                      defaults="Participants"
                    />
                  }
                  empty={
                    <EmptyState className="py-8">
                      <EmptyStateIcon>
                        <UsersIcon />
                      </EmptyStateIcon>
                      <EmptyStateTitle>
                        <Trans
                          t={t}
                          i18n={i18n}
                          ns="app"
                          i18nKey="pollParticipantsEmptyTitle"
                          defaults="No responses yet"
                        />
                      </EmptyStateTitle>
                      <EmptyStateDescription>
                        <Trans
                          t={t}
                          i18n={i18n}
                          ns="app"
                          i18nKey="pollParticipantsEmptyDescription"
                          defaults="Share the poll to start collecting responses."
                        />
                      </EmptyStateDescription>
                    </EmptyState>
                  }
                />
                {poll.disableComments ? null : (
                  <PollSection
                    id="poll-comments"
                    count={comments.length}
                    flush={comments.length > 0}
                    summary={
                      lastComment ? (
                        <Trans
                          t={t}
                          i18n={i18n}
                          ns="app"
                          i18nKey="pollCommentsSummary"
                          defaults="Last comment <time />"
                          components={{
                            time: (
                              <RelativeTime value={lastComment.createdAt} />
                            ),
                          }}
                        />
                      ) : null
                    }
                    title={
                      <Trans
                        t={t}
                        i18n={i18n}
                        ns="app"
                        i18nKey="comments"
                        defaults="Comments"
                      />
                    }
                  >
                    {comments.length > 0 ? (
                      <PollComments comments={oldestFirstComments} />
                    ) : (
                      <EmptyState className="py-8">
                        <EmptyStateIcon>
                          <MessageCircleIcon />
                        </EmptyStateIcon>
                        <EmptyStateTitle>
                          <Trans
                            t={t}
                            i18n={i18n}
                            ns="app"
                            i18nKey="commentsSheetEmpty"
                            defaults="No comments yet"
                          />
                        </EmptyStateTitle>
                        <EmptyStateDescription>
                          <Trans
                            t={t}
                            i18n={i18n}
                            ns="app"
                            i18nKey="pollCommentsEmptyDescription"
                            defaults="Comments left on the poll will appear here."
                          />
                        </EmptyStateDescription>
                      </EmptyState>
                    )}
                  </PollSection>
                )}
              </PollSections>
            </PollProvider>
          </div>
        </PageColumn>
      </PageContent>
    </PageShell>
  );
}
