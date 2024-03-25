"use client";

import { Badge } from "@rallly/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@rallly/ui/card";
import { Flex } from "@rallly/ui/flex";

import { trpc } from "@/app/providers";
import { Spinner } from "@/components/spinner";
import { Table } from "@/components/table";

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

  // Create Column Defition

  return (
    <Card>
      <CardHeader>
        <Flex gap="sm" align="center">
          <CardTitle>My Invites</CardTitle>
          <Badge>{data.total}</Badge>
        </Flex>
        <CardDescription>
          Manage the responses you have submitted
        </CardDescription>
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
