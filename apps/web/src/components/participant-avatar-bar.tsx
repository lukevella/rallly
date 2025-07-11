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
  max = Number.POSITIVE_INFINITY,
}: ParticipantAvatarBarProps) => {
  const totalParticipants = participants.length;

  const visibleCount = totalParticipants <= max ? totalParticipants : max - 1;

  const visibleParticipants = participants.slice(0, visibleCount);

  const tooltipParticipants = participants.slice(
    visibleCount,
    visibleCount + 10,
  );

  const remainingCount =
    totalParticipants - visibleCount - tooltipParticipants.length;

  const hiddenCount = totalParticipants - visibleCount;

  return (
    <ul className="-space-x-1 flex cursor-default items-center rounded-full bg-white p-0.5">
      {visibleParticipants.map((participant, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: Fix this later
        <Tooltip delayDuration={100} key={index}>
          <TooltipTrigger asChild>
            <li className="z-10 inline-flex items-center justify-center rounded-full ring-2 ring-white">
              <OptimizedAvatarImage
                name={participant.name}
                src={participant.image}
                size="sm"
              />
            </li>
          </TooltipTrigger>
          <TooltipPortal>
            <TooltipContent>{participant.name}</TooltipContent>
          </TooltipPortal>
        </Tooltip>
      ))}
      {hiddenCount > 0 ? (
        <li className="relative z-10 inline-flex items-center justify-center rounded-full ring-2 ring-white">
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className={cn(
                  "select-none",
                  "rounded-full bg-gray-100 px-1.5 font-semibold text-xs",
                  "inline-flex h-5 items-center justify-center",
                )}
              >
                +{hiddenCount}
              </span>
            </TooltipTrigger>
            <TooltipPortal>
              <TooltipContent className="z-10">
                <ul>
                  {tooltipParticipants.map((participant, index) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: Fix this later
                    <li key={index}>{participant.name}</li>
                  ))}
                  {remainingCount > 0 && (
                    <li>
                      <Trans
                        i18nKey="moreParticipants"
                        values={{ count: remainingCount }}
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
