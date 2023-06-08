import ModalProvider from "@/components/modal/modal-provider";
import { ParticipantsProvider } from "@/components/participants-provider";
import {
  OptionsProvider,
  PollContextProvider,
} from "@/components/poll-context";
import { usePoll } from "@/contexts/poll";
import { useUserPreferences } from "@/contexts/preferences";
import {
  TimeFormatProvider,
  TimeZoneProvider,
} from "@/contexts/time-preferences";

export const LegacyPollContextProvider = (props: React.PropsWithChildren) => {
  const poll = usePoll();

  const userPreferences = useUserPreferences();
  if (!poll || !userPreferences) {
    return null;
  }

  return (
    <ParticipantsProvider pollId={poll.id}>
      <PollContextProvider
        poll={poll}
        urlId={poll.participantUrlId}
        admin={false}
      >
        <ModalProvider>
          <TimeZoneProvider initialValue={userPreferences.timeZone}>
            <TimeFormatProvider initialValue={userPreferences.timeFormat}>
              <OptionsProvider>{props.children}</OptionsProvider>
            </TimeFormatProvider>
          </TimeZoneProvider>
        </ModalProvider>
      </PollContextProvider>
    </ParticipantsProvider>
  );
};
