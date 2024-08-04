import { InfoCard } from "@rallly/ui/info-card";

import Discussion from "@/components/discussion/discussion";
import { EventCard } from "@/components/event-card";
import { VotingForm } from "@/components/poll/voting-form";

export function GroupPollInvite() {
  return (
    <div className="mx-auto flex h-full max-w-4xl gap-6">
      <div className="grow space-y-4">
        <EventCard />
        <hr />
        <InfoCard title="Group Poll">
          <VotingForm>{/* <ResponsiveResults /> */}</VotingForm>
        </InfoCard>
        <hr />
        <Discussion />
      </div>
      {/* <EventCard />
      <VotingForm>
        <ResponsiveResults />
      </VotingForm> */}
      {/* <Discussion /> */}
    </div>
  );
}
