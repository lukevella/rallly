"use client";

import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { Popover, PopoverContent, PopoverTrigger } from "@rallly/ui/popover";
import { MessageSquareTextIcon } from "lucide-react";
import TruncatedLinkify from "@/features/poll/components/truncated-linkify";
import { useTranslation } from "@/i18n/client";

export function ParticipantNote({
  note,
  participantName,
  size = "icon-xs",
}: {
  note: string;
  participantName: string;
  size?: "icon" | "icon-xs";
}) {
  const { t } = useTranslation();
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            aria-label={t("participantNoteButton", {
              defaultValue: "Read note from {name}",
              name: participantName,
            })}
            size={size}
            variant="ghost"
          >
            <Icon>
              <MessageSquareTextIcon />
            </Icon>
          </Button>
        }
      />
      <PopoverContent className="whitespace-pre-wrap break-words text-sm">
        <TruncatedLinkify>{note}</TruncatedLinkify>
      </PopoverContent>
    </Popover>
  );
}
