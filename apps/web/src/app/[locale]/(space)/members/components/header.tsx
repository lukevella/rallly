"use client";

import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { UserPlusIcon } from "lucide-react";
import {
  PageHeader,
  PageHeaderActions,
  PageTitle,
} from "@/app/components/page-layout";
import { SearchInput } from "@/app/components/search-input";
import { Trans } from "@/components/trans";
import { useTranslation } from "@/i18n/client";

export function MembersHeader() {
  const { t } = useTranslation();
  return (
    <PageHeader>
      <PageTitle>
        <Trans i18nKey="members" defaults="Members" />
      </PageTitle>
      <PageHeaderActions>
        <SearchInput
          placeholder={t("searchMembers", { defaultValue: "Search members" })}
        />

        <Button variant="primary">
          <Icon>
            <UserPlusIcon />
          </Icon>
          <Trans i18nKey="addMember" defaults="Add member" />
        </Button>
      </PageHeaderActions>
    </PageHeader>
  );
}
