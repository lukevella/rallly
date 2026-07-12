import ModalProvider from "@/components/modal/modal-provider";
import { usePoll } from "@/features/poll/client";
import {
  OptionsProvider,
  PollContextProvider,
} from "@/features/poll/components/poll-context";

export const LegacyPollContextProvider = (props: React.PropsWithChildren) => {
  const poll = usePoll();

  if (!poll) {
    return null;
  }

  return (
    <PollContextProvider poll={poll}>
      <ModalProvider>
        <OptionsProvider>{props.children}</OptionsProvider>
      </ModalProvider>
    </PollContextProvider>
  );
};
