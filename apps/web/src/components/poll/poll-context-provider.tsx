import ModalProvider from "@/components/modal/modal-provider";
import { ParticipantsProvider } from "@/components/participants-provider";
import {
  OptionsProvider,
  PollContextProvider,
} from "@/components/poll-context";
import { usePoll } from "@/contexts/poll";

export const LegacyPollContextProvider = (props: React.PropsWithChildren) => {
  const poll = usePoll();

  if (!poll) {
    return null;
  }

  return (
    <ParticipantsProvider pollId={poll.id}>
      <PollContextProvider poll={poll} urlId={poll.id} admin={false}>
        <ModalProvider>
          <OptionsProvider>{props.children}</OptionsProvider>
        </ModalProvider>
      </PollContextProvider>
    </ParticipantsProvider>
  );
};
