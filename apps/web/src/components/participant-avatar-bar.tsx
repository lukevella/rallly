import { cn } from "@rallly/ui";
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from "@rallly/ui/tooltip";

import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { Trans } from "@/components/trans";

interface ParticipantAvatarBarProps {
  participants: { name: string; image?: string }[];
  max?: number;
}

export const ParticipantAvatarBar = ({
  participants,
  max = Infinity,
}: ParticipantAvatarBarProps) => {
  const visibleParticipants = participants.slice(0, max);
  const extraParticipants = participants.slice(max, max + 10);
  const moreParticipants =
    participants.length - visibleParticipants.length - extraParticipants.length;
  return (
    <ul className="flex cursor-default items-center -space-x-1">
      {visibleParticipants.map((participant, index) => (
        <Tooltip key={index}>
          <TooltipTrigger asChild>
            <li className="z-10 inline-flex items-center justify-center rounded-full ring-2 ring-white">
              <OptimizedAvatarImage
                name={participant.name}
                src={participant.image}
                size="xs"
              />
            </li>
          </TooltipTrigger>
          <TooltipContent>{participant.name}</TooltipContent>
        </Tooltip>
      ))}
      {extraParticipants.length > 0 ? (
        <li className="relative z-10 inline-flex items-center justify-center rounded-full ring-2 ring-white">
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className={cn(
                  "select-none",
                  "rounded-full bg-gray-100 px-1.5 text-xs font-semibold",
                  "inline-flex h-5 items-center justify-center",
                )}
              >
                +{extraParticipants.length + moreParticipants}
              </span>
            </TooltipTrigger>
            <TooltipPortal>
              <TooltipContent className="z-10">
                <ul>
                  {extraParticipants.map((participant, index) => (
                    <li key={index}>{participant.name}</li>
                  ))}
                  {moreParticipants > 0 && (
                    <li>
                      <Trans
                        i18nKey="moreParticipants"
                        values={{ count: moreParticipants }}
                        defaults="{count} more…"
                      />
                    </li>
                  )}
                </ul>
              </TooltipContent>
            </TooltipPortal>
          </Tooltip>
        </li>
      ) : null}
    </ul>
  );
};
