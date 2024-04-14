import { useParticipants } from "@/components/participants-provider";
import VoteIcon from "@/components/poll/vote-icon";
import { UserAvatar } from "@/components/user";

export function Attendees({ optionId }: { optionId: string }) {
  const { participants } = useParticipants();

  return (
    <ul className="flex flex-wrap gap-2">
      {participants.map((participant) => (
        <li
          key={participant.id}
          className="flex items-center gap-1.5 rounded-full bg-white p-1 text-sm"
        >
          <div className="relative">
            <UserAvatar size="xs" name={participant.name} />
          </div>
          {participant.name}
          <VoteIcon
            type={
              participant.votes.find((vote) => vote.optionId === optionId)?.type
            }
          />
        </li>
      ))}
    </ul>
  );
}
