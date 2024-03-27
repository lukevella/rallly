"use client";

import { Card } from "@rallly/ui/card";
import { Flex } from "@rallly/ui/flex";
import { InboxIcon, MailIcon } from "lucide-react";

import { EmptyState } from "@/app/components/empty-state";
import { trpc } from "@/app/providers";
import { Spinner } from "@/components/spinner";
import { Table } from "@/components/table";
import { Trans } from "@/components/trans";

import type { Response } from "./columns";
import { useInviteColumns } from "./columns";

export function ResponseList() {
  const { data } = trpc.responses.list.useQuery({
    pagination: {
      pageIndex: 0,
      pageSize: 20,
    },
  });

  const columns = useInviteColumns();
  if (!data) {
    return (
      <Flex className="h-screen" align="center" justify="center">
        <Spinner />
      </Flex>
    );
  }

  if (data.total === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={<InboxIcon />}
          title={<Trans i18nKey="noResponses" defaults="No Responses" />}
          description={
            <Trans
              i18nKey="emptyInboxDescription"
              defaults="When you respond to invites, they will show up here."
            />
          }
        />
      </div>
    );
  }

  // Create Column Defition

  return (
    <Card>
      <Table<Response>
        layout="auto"
        enableTableHeader={true}
        paginationState={{
          pageIndex: 0,
          pageSize: 20,
        }}
        columns={columns}
        data={data.responses}
      />
    </Card>
  );
}
