"use client";

import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@rallly/ui/popover";
import { MessageSquareTextIcon } from "lucide-react";
import TruncatedLinkify from "@/features/poll/components/truncated-linkify";
import { Trans, useTranslation } from "@/i18n/client";
import { RelativeTime } from "@/lib/datetime/relative-time";

export function ParticipantNote({
  note,
  participantName,
  createdAt,
  size = "icon-xs",
}: {
  note: string;
  participantName: string;
  createdAt: Date;
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
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>
            <Trans
              i18nKey="participantNoteTitle"
              defaults="{name} said:"
              values={{ name: participantName }}
            />
          </PopoverTitle>
          <RelativeTime
            value={createdAt}
            className="text-muted-foreground text-xs"
          />
        </PopoverHeader>
        <div className="max-h-48 overflow-y-auto whitespace-pre-wrap break-words text-sm">
          <TruncatedLinkify>{note}</TruncatedLinkify>
        </div>
      </PopoverContent>
    </Popover>
  );
}
