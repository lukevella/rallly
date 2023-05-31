import { ParticipantsProvider } from "@/components/participants-provider";
import { PollContextProvider } from "@/components/poll-context";
import { usePoll } from "@/contexts/poll";

export const LegacyPollContextProvider = (props: React.PropsWithChildren) => {
  const poll = usePoll();

  if (!poll) {
    return null;
  }

  return (
    <ParticipantsProvider pollId={poll.id}>
      <PollContextProvider
        poll={poll}
        urlId={poll.participantUrlId}
        admin={false}
      >
        {props.children}
      </PollContextProvider>
    </ParticipantsProvider>
  );
};
