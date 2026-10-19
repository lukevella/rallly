import { buttonVariants } from "@rallly/ui";
import { VideoIcon } from "lucide-react";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateFooter,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { Trans } from "@/i18n/client";
import { CONFERENCING_SETUP_DOCS_URL } from "../constants";

// Conferencing is switched on but no provider has credentials. Only an
// instance admin can fix that, so only they get the way forward.
export function ConferencingEmptyState({ isAdmin }: { isAdmin: boolean }) {
  return (
    <EmptyState>
      <EmptyStateIcon>
        <VideoIcon />
      </EmptyStateIcon>
      <EmptyStateTitle>
        <Trans
          i18nKey="conferencingEmptyStateTitle"
          defaults="No video call providers set up"
        />
      </EmptyStateTitle>
      <EmptyStateDescription>
        {isAdmin ? (
          <Trans
            i18nKey="conferencingEmptyStateAdminDescription"
            defaults="Add the OAuth credentials of a video call provider to your configuration and restart Rallly."
          />
        ) : (
          <Trans
            i18nKey="conferencingEmptyStateMemberDescription"
            defaults="Ask your administrator to set up a video call provider. You can still paste your own link when creating a poll."
          />
        )}
      </EmptyStateDescription>
      {isAdmin ? (
        <EmptyStateFooter>
          <a
            href={CONFERENCING_SETUP_DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants()}
          >
            <Trans
              i18nKey="conferencingEmptyStateSetupGuide"
              defaults="Read the setup guide"
            />
          </a>
        </EmptyStateFooter>
      ) : null}
    </EmptyState>
  );
}
