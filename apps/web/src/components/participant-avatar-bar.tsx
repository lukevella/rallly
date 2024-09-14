import { cn } from "@rallly/ui";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";

import { ParticipantAvatar } from "@/components/participant";

interface ParticipantAvatarBarProps {
  participants: { name: string }[];
  max?: number;
}

export const ParticipantAvatarBar = ({
  participants,
  max = Infinity,
}: ParticipantAvatarBarProps) => {
  const visibleCount = participants.length > max ? max - 1 : max;
  const hiddenCount = participants.length - visibleCount;
  return (
    <ul className="flex items-center -space-x-1">
      {participants.slice(0, visibleCount).map((participant, index) => (
        <Tooltip key={index}>
          <TooltipTrigger asChild>
            <li className="z-10 inline-flex items-center justify-center rounded-full ring-2 ring-white">
              <ParticipantAvatar name={participant.name} />
            </li>
          </TooltipTrigger>
          <TooltipContent>{participant.name}</TooltipContent>
        </Tooltip>
      ))}
      {hiddenCount > 1 ? (
        <li className="relative z-20 inline-flex items-center justify-center rounded-full ring-2 ring-white">
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className={cn(
                  "select-none",
                  "rounded-full bg-gray-100 px-1.5 text-xs font-semibold",
                  "inline-flex h-5 items-center justify-center",
                )}
              >
                +{hiddenCount}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <ul>
                {participants
                  .slice(visibleCount, 10)
                  .map((participant, index) => (
                    <li key={index}>{participant.name}</li>
                  ))}
              </ul>
            </TooltipContent>
          </Tooltip>
        </li>
      ) : null}
    </ul>
  );
};
