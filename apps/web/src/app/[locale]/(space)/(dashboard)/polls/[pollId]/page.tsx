import { redirect } from "next/navigation";
import { Trans } from "react-i18next/TransWithoutContext";
import {
  PageColumn,
  PageContent,
  PageHeader,
  PageShell,
  PageTitle,
} from "@/components/page";
import { PollProvider } from "@/features/poll/client";
import { NotificationToggle } from "@/features/poll/components/notification-toggle";
import { PollAdminMenu } from "@/features/poll/components/poll-admin-menu";
import { PollAdminViewSwitch } from "@/features/poll/components/poll-admin-view-switch";
import { loadPollInvites } from "@/features/poll/invite/loaders";
import { loadAdminPoll, loadPollActivity } from "@/features/poll/loaders";
import { loadActiveSpace } from "@/features/space/loaders";
import { getTranslation } from "@/i18n/server";
import { LEGACY_VIEW_PARAM, LEGACY_VIEW_VALUE } from "@/lib/poll-admin-view";
import { PollActivitySection } from "./components/poll-activity";
import { PollBreadcrumb } from "./components/poll-breadcrumb";
import { PollDetails } from "./components/poll-details";
import { PollResults } from "./components/poll-results";
import { PollSections } from "./components/poll-section";
import { PollStats } from "./components/poll-stats";
import { PollStatusCard } from "./components/poll-status-card";
import { PollStatusLabel } from "./components/poll-status-label";
import { ShareButton } from "./components/share-button";

export default async function Page({
  params,
}: {
  params: Promise<{ pollId: string }>;
}) {
  const { pollId } = await params;
  const [{ poll, participants, comments }, space] = await Promise.all([
    loadAdminPoll(pollId),
    loadActiveSpace(),
  ]);

  // This page reads within the active space. A poll the host manages
  // elsewhere (another space, or none) opens on the legacy page instead of
  // a 404, which the opt in's redirect lets through.
  if (poll.spaceId !== space.id) {
    redirect(`/poll/${pollId}?${LEGACY_VIEW_PARAM}=${LEGACY_VIEW_VALUE}`);
  }

  const [invites, activity, { t, i18n }] = await Promise.all([
    loadPollInvites(pollId),
    loadPollActivity(pollId),
    getTranslation(),
  ]);

  const invitedParticipantIds = new Set(
    invites.flatMap((invite) =>
      invite.participantId ? [invite.participantId] : [],
    ),
  );

  const tableParticipants = participants.map((participant) => ({
    ...participant,
    respondedAt: participant.createdAt,
    viaInvite: invitedParticipantIds.has(participant.id),
  }));

  return (
    <PageShell
      menuInNav
      nav={
        <PollBreadcrumb
          title={poll.title}
          status={<PollStatusLabel status={poll.status} />}
        />
      }
      navActions={
        // The header actions read the poll from the poll provider.
        <PollProvider
          poll={poll}
          participants={participants}
          comments={comments}
          viewerRole="admin"
        >
          <div className="flex items-center gap-1.5">
            <PollAdminViewSwitch pollId={poll.id} checked />
            <NotificationToggle />
            <PollAdminMenu />
          </div>
        </PollProvider>
      }
    >
      <PageHeader>
        <PageColumn>
          <PageTitle
            id="poll-title"
            showMenuButton={false}
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
                event={poll.event}
                floating={poll.timeZone === null}
              />
              <PollStats
                responseCount={participants.length}
                invitedCount={invites.length}
                respondedInviteCount={
                  invites.filter((invite) => invite.participantId).length
                }
                inviteAction={
                  <ShareButton pollId={poll.id} pollStatus={poll.status} />
                }
                options={poll.options}
                participants={participants}
                timeZone={poll.timeZone}
                canFinalize={poll.status !== "scheduled"}
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
                  participants={tableParticipants}
                  timeZone={poll.timeZone}
                  canPick={poll.status !== "scheduled"}
                />
                {activity.length > 0 ? (
                  <PollActivitySection
                    activity={activity}
                    participants={participants}
                    comments={comments}
                    timeZone={poll.timeZone}
                    title={
                      <Trans
                        t={t}
                        i18n={i18n}
                        ns="app"
                        i18nKey="pollActivityHeading"
                        defaults="Activity"
                      />
                    }
                  />
                ) : null}
              </PollSections>
            </PollProvider>
          </div>
        </PageColumn>
      </PageContent>
    </PageShell>
  );
}
