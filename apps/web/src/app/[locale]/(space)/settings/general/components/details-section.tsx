"use client";

import { FieldGroup } from "@rallly/ui/field";
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionHeader,
  PageSectionTitle,
} from "@/components/page-layout";
import { useSpace } from "@/features/space/client";
import { Trans } from "@/i18n/client";
import { SpaceSettingsForm } from "./space-settings-form";

export function DetailsSection({ disabled = false }: { disabled?: boolean }) {
  const { data: space } = useSpace();

  return (
    <PageSection variant="card">
      <PageSectionHeader>
        <PageSectionTitle>
          <Trans i18nKey="details" defaults="Details" />
        </PageSectionTitle>
        <PageSectionDescription>
          <Trans
            i18nKey="spaceDetailsCardDescription"
            defaults="Basic information about this space"
          />
        </PageSectionDescription>
      </PageSectionHeader>
      <PageSectionContent>
        <FieldGroup variant="divided">
          <SpaceSettingsForm space={space} disabled={disabled} />
        </FieldGroup>
      </PageSectionContent>
    </PageSection>
  );
}
