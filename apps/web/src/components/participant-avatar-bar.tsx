import { cn } from "@rallly/ui";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import clsx from "clsx";

import { ColoredAvatar } from "@/components/poll/participant-avatar";

interface ParticipantAvatarBarProps {
  participants: { name: string }[];
  max: number;
}

export const ParticipantAvatarBar = ({
  participants,
  max = Infinity,
}: ParticipantAvatarBarProps) => {
  const hiddenCount = participants.length - max;
  return (
    <div className="flex items-center">
      {participants
        .slice(0, hiddenCount === 1 ? max + 1 : max)
        .map((participant, index) => (
          <Tooltip delayDuration={0} key={index}>
            <TooltipTrigger asChild>
              <div
                className={cn({
                  "-mr-1":
                    index !== max - 1 || index !== participants.length - 1,
                })}
              >
                <ColoredAvatar
                  className="select-none ring-2 ring-white"
                  name={participant.name}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>{participant.name}</TooltipContent>
          </Tooltip>
        ))}
      {hiddenCount > 1 ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={clsx(
                "select-none ring-2 ring-white",
                "rounded-full bg-gray-200 px-1.5 text-xs font-semibold",
                "inline-flex h-6 min-w-[24px] items-center justify-center",
              )}
            >
              <div>+{hiddenCount}</div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <ul>
              {participants.slice(max, 10).map((participant, index) => (
                <li key={index}>{participant.name}</li>
              ))}
            </ul>
          </TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  );
};
