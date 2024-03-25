"use client";

import { Badge } from "@rallly/ui/badge";
import { Card, CardHeader, CardTitle } from "@rallly/ui/card";
import { Flex } from "@rallly/ui/flex";
import { MailIcon } from "lucide-react";

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
          icon={<MailIcon />}
          title={<Trans i18nKey="noInvites" defaults="No Invites Found" />}
          description={
            <Trans
              i18nKey="noInvitesDescription"
              defaults="You have not been invited to any events yet."
            />
          }
        />
      </div>
    );
  }

  // Create Column Defition

  return (
    <Card>
      <CardHeader>
        <Flex gap="sm" align="center">
          <CardTitle>My Invites</CardTitle>
          <Badge>{data.total}</Badge>
        </Flex>
      </CardHeader>
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
