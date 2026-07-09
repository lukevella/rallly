import ModalProvider from "@/components/modal/modal-provider";
import {
  OptionsProvider,
  PollContextProvider,
} from "@/components/poll-context";
import { usePoll } from "@/features/poll/client";

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
