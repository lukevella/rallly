import ModalProvider from "@/components/modal/modal-provider";
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
    <PollContextProvider poll={poll} urlId={poll.id} admin={false}>
      <ModalProvider>
        <OptionsProvider>{props.children}</OptionsProvider>
      </ModalProvider>
    </PollContextProvider>
  );
};
